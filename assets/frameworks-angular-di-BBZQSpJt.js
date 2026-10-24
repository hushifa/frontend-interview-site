var e={answerHtml:`<p>Angular 通过 injector 根据 token 查找 provider，再创建或返回对应实例。provider 可以注册在应用、路由、组件或其他 injector 层级，因此同一个服务 token 在不同层级可能对应不同实例。</p>
<p>作用域会影响状态共享、生命周期和资源清理。把服务放在组件 providers 中可能让每个组件实例获得独立状态；放在应用级则更适合跨页面共享，但要避免把所有业务状态都塞进全局服务。</p>
<p>依赖注入只解决创建和获取依赖，不会自动解决循环依赖、异步初始化、权限边界或订阅清理。provider 配置还要结合 standalone、路由和当前 Angular 版本的 API 形态核对。</p>`};export{e as default};