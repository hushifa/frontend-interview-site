var e={answerHtml:`<p>插槽让父组件决定子组件某个区域的内容；作用域插槽允许子组件把数据暴露给插槽内容，适合表格单元格、列表项和无渲染逻辑组件等模式。</p>
<p>provide/inject 适合跨多层组件传递依赖，减少中间层透传。提供值是否响应式取决于传入内容；建议把修改逻辑留在提供方，并通过明确的方法暴露能力，必要时提供 readonly 视图。</p>
<p>两者不能混为一谈：插槽关注内容组合，依赖注入关注跨层协作。公共组件要明确插槽参数、注入键以及缺失时的回退行为，避免隐藏耦合导致单独测试或复用时出错。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://vuejs.org/guide/components/slots.html">Slots | Vue.js</a></li>
</ul>`};export{e as default};