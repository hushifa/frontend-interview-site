var e={answerHtml:`<p>Error Boundary 用于捕获子树渲染等过程中的错误并显示回退界面；事件处理器和一般异步回调的错误需要在对应边界自行处理。错误边界也应有重试或返回入口，避免整页白屏。</p>
<p>Suspense 用于支持其协议的异步依赖等待，例如 lazy 组件或框架集成的数据源。普通 useEffect 中的 fetch 不会因为外面套了 Suspense 就自动产生加载回退。</p>
<p>加载、空数据和失败是不同状态，应分别设计。边界放置过大可能让小组件加载隐藏整页；过碎又会产生跳动和大量闪烁。根据用户可独立理解的内容区域划分更合理。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://react.dev/reference/react/Component">Component – React</a></li>
</ul>`};export{e as default};