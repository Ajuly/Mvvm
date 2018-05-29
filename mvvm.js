function Juddy(options = {}) {
    this.$options = options; // 将所有的属性挂载在了$options
    // this._data
    var data = this._data = this.$options.data;
    observe(data);
    // this 代理了 this._data
    for (let key in data) {
        Object.defineProperty(this, key, {
            enumerable: true,
            get() {
                return this._data[key];
                // this.a = {a:1}
            },
            set(newVal) {
                this._data[key] = newVal;
            }
        })
    }
    initComputed.call(this);
    // 编译
    new Compile(options.el, this);
}
function initComputed(){
    let vm = this;
    console.log(this.$options);
    let computed = this.$options.computed;
    Object.keys(computed).forEach(function(key){
        Object.defineProperty(vm,key,{
            get:typeof computed[key] === 'function'?computed[key]:computed[key].get,
            set(){

            }
        })
    });
}

function Compile(el, vm) {
    // 替换
    // el 表示替换的范围  vm 数据
    vm.$el = document.querySelector(el);
    // 创建文档碎片
    let fragment = document.createDocumentFragment();
    while (child = vm.$el.firstChild) {
        // 将app中的内容 移入到内存中
        fragment.appendChild(child);
    }
    
    replace(fragment);
    function replace(fragment) {
        // Array.from(fragment.childNodes) [text, p, text, div, text]
        Array.from(fragment.childNodes).forEach(function (node) {
            // 循环每一层
            // node.nodeType 元素节点的类型   1 元素节点  2 属性节点 3 文本节点
            var text = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            if (node.nodeType === 3 && reg.test(text)) {
                // console.log(RegExp.$1); // a.a b
                let arr = RegExp.$1.split('.'); // [a,a]
                let val = vm;
                arr.forEach(function (k) {
                    val = val[k]
                })
                
                new Watcher(vm,RegExp.$1,function(newVal){
                    // 函数里需要接收一个新的值
                    node.textContent = text.replace(/\{\{(.*)\}\}/, newVal)
                });
                // 替换的逻辑
                node.textContent = text.replace(/\{\{(.*)\}\}/, val)

            }
            // 元素节点
            if (node.nodeType === 1){
                let nodeAttrs = node.attributes;// 获取当前dom节点的属性
                Array.from(nodeAttrs).forEach(function(attr){
                    console.log(attr.name);// type   v-model
                    let name = attr.name; // type="text"
                    let exp = attr.value; // v-model = "b"
                    // 显示默认值
                    if(name.indexOf('v-') == 0){// v-model
                        // node.value = vm[exp];
                    }
                    // 订阅
                    new Watcher(vm,exp,function(newVal){
                        // 当watcher触发时会自动将内容放到输入框内
                        node.value = newVal;
                    });
                    // 给输入框添加事件
                    node.addEventListener('input',function(e){
                        let newVal = e.target.value;
                        vm[exp] = newVal;
                    })
                })
            }
            if (node.childNodes) {
                replace(node);
            }
        })

    }

    vm.$el.appendChild(fragment);
}

// 观察对象 给对象增加Object.DefineProperty
function Observe(data) { // 这里写我们的主要逻辑
    let dep = new Dep();
    for (let key in data) {
        // 把data属性通过object.defineProperty 的方式 定义属性
        let val = data[key];
        observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                Dep.target && dep.addSub(Dep.target); // [watcher]
                return val;
            },
            set(newVal) { // 更改值的时候
                if (newVal === val) {
                    // 设置的值和之前是一样的
                    return;
                }
                val = newVal;
                // 如果以后在获取值的时候将刚才设置的值丢回去
                observe(newVal);
                dep.notify();// 让所有的watch的update方法执行即可
            }
        });
    }
}

function observe(data) {
    if (typeof data !== 'object') return;
    return new Observe(data);
}

// 多层次需要递归

// vue 特点不能新增不存在的属性 不能存在的属性没有get和set
// 深度响应 因为每次赋予一个新对象时会给这个新对象增加数据劫持

function Dep(){
    this.subs = [];
}

Dep.prototype.addSub = function(sub){
    this.subs.push(sub);
};

Dep.prototype.notify = function(){
    this.subs.forEach(sub => sub.update());
};

function Watcher(vm,exp,fn){
    this.fn = fn;
    this.vm = vm;
    this.exp = exp;// 添加到订阅中
    Dep.target = this;
    let val = vm;
    let arr = exp.split('.');
    arr.forEach(function(k){ // this.a.a
        val = val[k];
    });
    Dep.target = null;
};

Watcher.prototype.update = function(){
    let val = this.vm;
    let arr = this.exp.split('.');
    arr.forEach(function(k){ // this.a.a
        val = val[k];
    });
    this.fn(val); // newVal
};


