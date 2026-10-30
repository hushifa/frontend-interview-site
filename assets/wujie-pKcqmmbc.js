var e={notesHtml:`<p>子应用的 JS 运行在同域 iframe 里，DOM 渲染到 WebComponent 的 Shadow DOM 中，隔离天然且支持 Vite 子应用，提供 React 和 Vue 的封装组件，适合子应用技术栈混杂的场景。</p>
<p>Shadow DOM 会影响挂到 body 上的弹窗和全局样式，框架为此做了代理补丁，个别组件库的弹层仍可能需要调整。保活模式和重建模式的生命周期不同，切换时要留意状态是否保留。</p>
<p>许可：MIT。</p>`};export{e as default};