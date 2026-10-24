var e={answerHtml:`<p><code>env(safe-area-inset-top/right/bottom/left)</code> 提供设备安全区域的环境变量，适合给全屏页面、固定顶部栏和底部操作栏增加内边距。通常需要结合 viewport 的 <code>viewport-fit</code> 配置，并保留普通设备的零值回退。</p>
<p>安全区域是布局约束，不是一个固定像素。横屏、旋转、分屏和浏览器 UI 变化都可能改变值；底部栏应把可点击区域和背景延伸区分开，不能只给文字加 padding。</p>
<p>同时要处理键盘、VisualViewport 和滚动容器，避免安全区域 padding 与键盘避让重复叠加。真实设备测试比桌面模拟器更可靠。</p>`};export{e as default};