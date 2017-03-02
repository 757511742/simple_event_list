;(function(){
    'use strict';
    var $form_add_task=$(".add-task");
    var $body=$('body');
    var $window=$(window);
    var task_list=[];
    var $delete_item;
    var $detail_item;
    var $task_detail=$('.task-detail');
    var $task_detail_mask=$('.task-detail-mask');
    var current_index;
    var $update_form; 
    var $task_detail_content;
    var $task_detail_content_input;
    var $checkbox_compelete;
    var $msg=$('.msg');
    var $msg_content=$('.msg').find('.msg-content');
    var $msg_confirm=$('.msg').find('button');
    var $alerter=$('.alerter');
    
    init();
    
    
    
    
    function pop(arg){
        if(!arg) console.error('pop title is required');
        var conf={},
        $box,
        $mask,
        $title,
        $content,
        $confirm,
        $cancel,
        dfd,
        confirmed,
        timer;
        
        if(typeof arg=='string')
        {
            conf.title=arg;
        }
        else conf=$.extend(conf,arg);
        
        dfd=$.Deferred();
        
        $box=$('<div>'+
        '<div class="pop-title">'+conf.title+'</div>'+
        '<div class="pop-content">'+
        '<div><button style="margin-right:5px" class="primary confirm">确定</button><button class="cancel">取消</button></div>'+
        '</div>'+
        '</div>')
            .css({
                color:'#444',
                position:'fixed',
                width:300,
                height:'auto',
                padding:'10px 10px',
                background:'#fff',
                'border-radius':'2px',
                'box-shadow':'0 4px 5px 5px rgba(0,0,0,.3)'
            })
            
        
        
        $title=$box.find('.pop-title').css({
            padding:'5px 10px',
            'font-weight':900,
            'font-size':'20px',
            'text-align':'center'
        });
        
        $content=$box.find('.pop-content').css({
            padding:'5px 10px',
            'text-align':'center'

        })
          
        $confirm=$content.find('button.confirm');
        $cancel=$content.find('button.cancel');
        
        
        $mask=$('<div></div>')
            .css({
                position:'fixed',
                top:0,
                right:0,
                bottom:0,
                left:0,
                background:'rgba(0,0,0,.5)'
            })
            
        timer=setInterval(function(){
            if(confirmed!==undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        },50);
            
        $confirm.on('click',function(){
            confirmed=true;
        });
        
        $cancel.on('click',function(){
            confirmed=false;
        });
        
        $mask.on('click',function(){
            confirmed=false;
        })
        
        function dismiss_pop(){
            $mask.remove();
            $box.remove();
        }
        
        function adjust_box_position(){
            var window_width=$window.width();
            var window_height=$window.height();
            var box_width=$box.width();
            var box_height=$box.height();
            var move_x,move_y;
            
            move_x=(window_width-box_width)/2;
            move_y=(window_height-box_height)/2-30;
            
            $box.css({
                left:move_x,
                top:move_y
            })
           
            
        }
        $window.on('resize',function(){
            adjust_box_position();
        })
        
        
        
        
        
        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();/*一开始触发窗口缩放*/
        return dfd.promise();
        
    }
    
    function listen_msg_event(){
        $msg_confirm.on("click",function(){
            hide_msg();
        })
    }
    
    $form_add_task.on('submit',function(e){
        var new_task={};
        var $input;
        e.preventDefault();
        /*获取newtask*/
        $input=$(this).find('input[name=content]');
        new_task.content=$input.val(); 
        /*如果新task为空*/
        if(!new_task.content) return;
        
        /*存入newtask*/
        if(add_task(new_task)){
            /*render_task_list();*//*更新页面的列表*/
            $input.val('');
        }
        
    });
    $task_detail_mask.on('click',hide_task_detail);
    
    /*查找并监听所有删除按钮的点击事件*/
    function listen_task_delete(){
       $delete_item.on('click',function(){
        var $this=$(this);
        /*找到删除按钮所在的task元素*/
        var $item=$this.parent().parent();
        var index=$item.data('index');
        /*确认删除*/
            pop("确定删除吗？")
            .then(function(r){
                if(r)
                    delete_task(index);
                else
                    null; 
        });
        
    }); 
    }
    
    /*监听打开task的事件*/
    function listen_task_detail(){
        var index;
        $('.task-item').on('dblclick',function(){
            index=$(this).data('index');
            show_task_detail(index);
        })
        
        $detail_item.on('click',function(){
            var $this=$(this);
            var $item=$this.parent().parent();
            index=$item.data('index');
            show_task_detail(index);
        });
    }
    
    /*监听checkbox被点击*/
    function listen_checkbox_compelete(){
        $checkbox_compelete.on("click",function(){
            var $this=$(this);
            console.log('$this',$this);
            var index=$this.parent().parent().data('index');
            var item=store.get('task_list')[index];
            
            if(item&&item.compelete)
            {
                update_task(index,{compelete:false});
               
            }
            else
            {
                update_task(index,{compelete:true});
                
            }
             /*update_task(item,{compelete:is_compelete});*/
        });
        
        
    }
    
    /*查看task详情*/
    function show_task_detail(index){
        /*生成详情模板*/
        render_task_detail(index);
        current_index=index;
        /*显示详情模板*/
         $task_detail.show();
         $task_detail_mask.show();
         
    }
    
    /*隐藏详情*/
    function hide_task_detail(){
         $task_detail.hide();
         $task_detail_mask.hide();
    }
    
    /*渲染指定task的详细信息*/
    function render_task_detail(index){
        if(index===undefined||!task_list[index]) return;
        var item=task_list[index];
        
        var tpl =
            '<form>'+
            '<div class="content">'+
            item.content+
            '</div>'+
            '<div class="input-item"><input style="display:none" type="text" name="content" value="'+(item.content||'')+'"></div>'+
            '<div>'+
            '<div class="desc input-item">'+
            '<textarea name="desc">'+(item.desc||'')+'</textarea>'+
            '</div>'+
            '</div>'+
            '<div class="remain input-item">'+
            '<label>提醒时间</label>'+
            '<input class="datetime" type="text" name="remain" id="" value="'+(item.remain_date||"")+'" />'+
            '</div>' +
            ' <div class="input-item"><button type="submit">更新</button></div>'+
            
            '</form>';
        
        /*清空task模板*/    
        $task_detail.html("");
        /*新模板替换*/
        $task_detail.html(tpl);
        /*选中用来监听submit*/
        $(".datetime").datetimepicker();
        $update_form=$task_detail.find('form');
        $task_detail_content=$update_form.find('.content');
        $task_detail_content_input=$update_form.find('[name=content]');
        
        /*详情的标题双击*/ 
        $task_detail_content.on("dblclick",function(){
            $task_detail_content_input.show();
            $task_detail_content.hide();
        })
        
        /*更新按钮事件*/
        $update_form.on("submit",function(e){
            e.preventDefault();
            var data = {};
            /*更新表单各个input的值*/
            data.content=$(this).find('[name=content]').val();
            data.desc=$(this).find('[name=desc]').val();
            data.remain_date=$(this).find('[name=remain]').val();
            /*console.log('data',data);*/
            update_task(index,data);
            /*如果修改了时间，则把提醒的标志informed设置为false*/
            update_task(index,{informed:false});
            hide_task_detail();
        });
        
       
    }
    
    /*更新task*/
    function update_task(index,data){
         if(index===undefined||!task_list[index]) return;
         
         task_list[index]=$.extend({},task_list[index],data);
/*         console.log('task_list[index]',task_list[index]);*/        
        refresh_task_list();
    }
    
    /*添加task*/
    function add_task(new_task){
       
       /*将新task推入task_list*/
       task_list.push(new_task);
       /*更新storage*/
        refresh_task_list();
        return true;
        
    }
    
    /*刷新localStorage并渲染tpl*/
    function refresh_task_list(){
        store.set('task_list',task_list);
        render_task_list();
    }
    
    /*渲染全部task*/
    function render_task_list(){
        var $task_list = $('.task-list');
        
        $task_list.html('');
        var compelete_item=[];
        
        for(var i=0;i<task_list.length;i++){
            var item=task_list[i];
            var $task;
            if(item && item.compelete)
                compelete_item[i]=item;
            else
               $task=render_task_item(item,i);
            /*console.log("$task",$task);*/
            $task_list.prepend($task);/*最新添加的排前面*/
        }
        
        for(var j=0;j<compelete_item.length;j++){
             $task=render_task_item(compelete_item[j],j);
             if(!$task) continue;
             $task.addClass('compeleted');
            $task_list.append($task);    
        }
        
        $delete_item=$('.action.delete');
        $detail_item=$('.action.detail');
        $checkbox_compelete=$('.task-list .compelete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_compelete();
    }   
    
    /*渲染一条task*/
    function render_task_item(data,index){
        if(!data||index===undefined) return;
        var list_item_tpl=
                '<div class="task-item" data-index="'+index+'">'+
                '<span><input class="compelete"'+(data.compelete?'checked':'')+' type="checkbox"  /></span>'+
                '<span class="task-content">'+data.content+'</span>'+
                '<span class="fr">'+
                '<span class="action delete"> 删除</span>'+
                '<span class="action detail"> 详细</span>'+
                '</span></div>' ;
        return $(list_item_tpl);        
    }
    
    /*初始化*/
    function init(){
       
        task_list=store.get('task_list')||[];

        listen_msg_event();
        if(task_list.length){
            render_task_list();
        }
        
        task_time_check();
    }
    
    function task_time_check(){

        var current_time;
        var itl=setInterval(function(){
          for(var i=0;i<task_list.length;i++){
            var item = store.get('task_list')[i];
            var task_time;
            if(!item || !item.remain_date ||item.informed) continue;
            
            current_time=(new Date()).getTime();
            
            task_time=(new Date(item.remain_date)).getTime();
            /*console.log("task_time",task_time);*/
            if(current_time-task_time>=1){
               
                update_task(i,{informed:true});
                show_msg(item.content);
                
            }
          } 
        },300);
        
        
    }
    
    /*时间提醒*/
    function show_msg(msg){
        /*if(!msg) return;*/
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }
    function hide_msg(msg){
        $msg.hide();
    }
    /*删除一条task*/
    function delete_task(index){
        /*如果不存在index或没有index*/
        if(index===undefined||!task_list[index]) return;
        delete task_list[index];
        /*更新localStorage*/
         refresh_task_list()
        
    }
    
    
    
})();