// 发布订阅模式 订阅 发布 [fn1,fn2,fn3]  
// 订阅：将需要执行的函数放到数组里
// 发布：讲述数组里的函数依次执行

// 绑定的方法 都有一个updtate属性
function Dep(){
    this.subs = [];
}

Dep.prototype.addSub = function(sub){
    // 订阅
    this.subs.push(sub);
};

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