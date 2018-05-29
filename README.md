__双向数据绑定：__数据影响视图，视图影响数据
Angular 脏值检测  
Vue 数据劫持 + 发布订阅模式

#### <a name="mariow"></a>Object.defineProperty应用
不兼容低版本
1.configurable  可删除
2.writable 可重写
3.enumerble 可枚举
4.get set 

```javascript
let obj = {};
Object.defineProperty(obj,'person',{
    configurable:true, // 可删除
    // writable:true, // 可重写
    enumerable:true, // 可枚举
    // value:"juddy",
    get(){ // 获取obj.person的值，会调用get方法
        return "juddy";
    },
    set(val){
       console.log(val) 
    }
});
console.log(obj);
// delete obj.person;
// obj.person = 'gfx';
for (const key in obj) {
    console.log(key); // person
}
console.log(obj);
```

### <a name="t7rrie"></a>1.数据劫持 Observe

```javascript
function Juddy(options = {}) {
    this.$options = options; // 将所有的属性挂载在了$options
    // this._data
    var data = this._data = this.$options.data;
    observe(data);
}

// 观察对象 给对象增加Object.DefineProperty
function Observe(data) { // 这里写我们的主要逻辑
    for (let key in data) {
        // 把data属性通过object.defineProperty 的方式 定义属性
        let val = data[key];
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                return val;
            },
            set(newVal) { // 更改值的时候
                if (newVal === val) {
                    // 设置的值和之前是一样的
                    return;
                }
                val = newVal;
                // 如果以后在获取值的时候将刚才设置的值丢回去
            }
        });
    }
}

function observe(data) {
    return new Observe(data);
}


-----------
let juddy = new Juddy({
    el:"#app",
    data:{
        a:1
    }
});
```

在控制台进行打印？ juddy


![image.png | left | 386x161](https://cdn.yuque.com/yuque/0/2018/png/116392/1527562381183-fc3c9b30-966a-4e57-b95a-a413f16e4e67.png "")


设置值：juddy.\_data.a = 8;
打印值：juddy.\_data.a
8

如果data 的结构比较复杂呢？<span data-type="color" style="color:#F5222D">进行递归</span>

```javascript

let juddy = new Juddy({
    el:"#app",
    data:{
        a:{
            a:10
        }
    }
});

juddy._data.a.a
10
juddy._data.a.a = 100;
100
juddy._data.a.a
100
```

### <a name="9nazgf"></a>2.数据代理
想直接的juddy.a来进行取值和赋值，那么这样就需要进行数据的代理：this代理this.\_data

```javascript
function Juddy(options = {}) {
    this.$options = options; // 将所有的属性挂载在了$options
    // this._data
    var data = this._data = this.$options.data;
    observe(data);

    // this 代理了 this._data
    for (let key in data) {
        Object.defineProperty(this,key,{
            enumerable:true,
            get(){
                return this._data[key];
                // this.a = {a:1}
            },
            set(newVal){
                this._data[key] = newVal;
            }
        })
    }

}
```

vue 特点不能新增不存在的属性 不能存在的属性没有get和set
深度响应 因为每次赋予一个新对象时会给这个新对象增加数据劫持

### <a name="yad1pm"></a>3.编译模版Compile

* 1.创建文档碎片
* 2.元素节点类型的判断  
* 3.内容的替换

```javascript
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
    // 编译
    new Compile(options.el, this);
}

---------------------

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
                console.log(RegExp.$1); // a.a b
                let arr = RegExp.$1.split('.'); // [a,a]
                let val = vm;
                arr.forEach(function (k) {
                    val = val[k]
                })
                node.textContent = text.replace(/\{\{(.*)\}\}/, val)

            }
            if (node.childNodes) {
                replace(node);
            }
        })

    }

    vm.$el.appendChild(fragment);
}

---------------------

// 观察对象 给对象增加Object.DefineProperty
function Observe(data) { // 这里写我们的主要逻辑
    for (let key in data) {
        // 把data属性通过object.defineProperty 的方式 定义属性
        let val = data[key];
        observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                return val;
            },
            set(newVal) { // 更改值的时候
                if (newVal === val) {
                    // 设置的值和之前是一样的
                    return;
                }
                val = newVal;
                // 如果以后在获取值的时候将刚才设置的值丢回去
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
```

### <a name="9v26tp"></a>4.发布订阅模式
上面已经实现了编译将数据渲染到页面，那怎样实现数据发生改变页面也随之改变？
```javascript
// 发布订阅模式 订阅 发布 [fn1,fn2,fn3]  
// 订阅：将需要执行的函数放到数组里
// 发布：讲述数组里的函数依次执行

// 绑定的方法 都有一个updtate属性
function Dep(){
    this.subs = [];
}

// 订阅
Dep.prototype.addSub = function(sub){
    this.subs.push(sub);
};
// 发布
Dep.prototype.notify = function(){
    this.subs.forEach(sub => sub.update());
};

function Watcher(fn){
    // Watcher是一个类，通过这个类创建的
    this.fn = fn;
};

Watcher.prototype.update = function(){
    this.fn();
};
// 监听函数
let watcher = new Watcher(function(){
    console.log(1);
});

let dep = new Dep();
dep.addSub(watcher); // 将watcher放到了数组中 
dep.addSub(watcher);
console.log(dep.subs);


dep.notify();
```

### <a name="4ap1gq"></a>5.链接视图和数据
```javascript
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
    // 编译
    new Compile(options.el, this);
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
                console.log(RegExp.$1); // a.a b
                let arr = RegExp.$1.split('.'); // [a,a]
                let val = vm;
                arr.forEach(function (k) {
                    val = val[k]
                })

                ----------------------
          
                new Watcher(vm,RegExp.$1,function(newVal){
                    // 函数里需要接收一个新的值
                    node.textContent = text.replace(/\{\{(.*)\}\}/, newVal)
                });

                -----------------------

                // 替换的逻辑
                node.textContent = text.replace(/\{\{(.*)\}\}/, val)
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
                --------------------
                Dep.target && dep.addSub(Dep.target); // [watcher]
                --------------------
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
                --------------------
                dep.notify();// 让所有的watch的update方法执行即可
                --------------------
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



```
### <a name="0qc0mx"></a>6.双向数据绑定的实现
```javascript
// 修改replace方法
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
----------
            // 元素节点
            if (node.nodeType === 1){
                let nodeAttrs = node.attributes;// 获取当前dom节点的属性
                Array.from(nodeAttrs).forEach(function(attr){
                    console.log(attr.name);// type   v-model
                    let name = attr.name; // type="text"
                    let exp = attr.value; // v-model = "b"

                    // 这是默认值的显示
                    if(name.indexOf('v-') == 0){// v-model
                        node.value = vm[exp];
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
----------
            if (node.childNodes) {
                replace(node);
            }
        })

    }
```

### <a name="y9n4tv"></a>7.实现computed



![image.png | left | 333x432](https://cdn.yuque.com/yuque/0/2018/png/116392/1527583734429-b66555d3-80bf-447f-8243-56710b7030e3.png "")


具体的实现：
```javascript
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


在编译之前进行调用
initComputed.call(this);
// 编译
new Compile(options.el, this);
```
