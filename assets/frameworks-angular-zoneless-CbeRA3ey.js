var e={answerHtml:`<p>Zoneless Angular 不再依赖 Zone.js 拦截所有异步任务来触发变更检测，而是依靠 Angular 能识别的信号更新、模板事件、输入变化和其他通知。这样可以减少全局 monkey patch，但组件必须正确表达状态变化。</p>
<p>直接修改普通对象、第三方回调或脱离 Angular 生命周期的异步数据，可能不会自动触发视图更新。应使用 signals、输入更新或明确的变更通知，并检查与现有库的兼容性。</p>
<p>迁移时要验证测试、SSR、hydration、定时器和第三方插件。Zoneless 不是单纯删除一个依赖，重点是让状态来源和更新路径显式化。</p>`};export{e as default};