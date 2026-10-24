var e={answerHtml:`<p>Web Share API 允许页面调用系统分享面板，但通常要求安全上下文和用户激活，且不同浏览器支持的 <code>url</code>、<code>text</code>、<code>files</code> 能力不同。调用可能被用户取消，也可能因数据格式或权限失败。</p>
<p>分享按钮应先检测 <code>navigator.share</code> 和必要能力，再提供复制链接、生成二维码或展示可复制文本的降级。不要在页面加载时自动触发分享，也不要把未确认的敏感 URL 放进分享内容。</p>
<p>分享完成不代表对方收到内容；它只是把数据交给系统或目标应用。业务仍应处理取消、重复点击和移动端返回行为。</p>`};export{e as default};