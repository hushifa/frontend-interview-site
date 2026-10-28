var e={answerHtml:`<p>设计一个备注输入框时，固定高度太小会让用户频繁滚动，固定高度太大又会在列表里占据很多空白。过去通常用 JavaScript 监听 <code>input</code>，读取 <code>scrollHeight</code>，再修改 textarea 的高度；这套逻辑要处理字体加载、换行、撤销、粘贴和组件卸载。<code>field-sizing</code> 提供了一个 CSS 层面的尺寸策略，让部分表单控件可以根据内容参与尺寸计算：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.comment</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">2.5rem</span>;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">14rem</span>;
  <span class="hljs-attribute">inline-size</span>: <span class="hljs-built_in">min</span>(<span class="hljs-number">100%</span>, <span class="hljs-number">42rem</span>);
  <span class="hljs-attribute">overflow</span>: auto;
  <span class="hljs-attribute">resize</span>: vertical;
}
</code></pre></div>
<p><code>field-sizing: content</code> 不是“无限自动增长”。它改变控件的固有尺寸计算方式，最终仍会受到 <code>min-*</code>、<code>max-*</code>、父容器、字体、换行和滚动策略影响。应用要给出合理上限，否则一段没有换行的长文本可能把布局撑出视口。</p>
<h2>fixed 和 content 表达不同的产品意图</h2>
<p>默认的 <code>field-sizing: fixed</code> 使用控件原本的尺寸规则，适合登录框、表格筛选和需要稳定对齐的表单。<code>content</code> 适合备注、标签输入和选项文字长度差异较大的控件，但会让布局随内容变化：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.search-input</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-inline-size</span>: <span class="hljs-number">12rem</span>;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">32rem</span>;
}

<span class="hljs-selector-class">.settings-form</span> <span class="hljs-selector-tag">input</span>,
<span class="hljs-selector-class">.settings-form</span> <span class="hljs-selector-tag">select</span> {
  <span class="hljs-attribute">field-sizing</span>: fixed;
  <span class="hljs-attribute">inline-size</span>: <span class="hljs-number">100%</span>;
}
</code></pre></div>
<p>自适应宽度的输入框在输入过程中可能改变旁边按钮的位置。对于工具栏、表格列和多字段横排布局，应优先保持稳定尺寸，或把可变控件放在不会推动关键操作的容器中。不要因为一行 CSS 能自动适应文本，就把所有表单都切换为 content。</p>
<h2>textarea 仍需要处理长文本和换行</h2>
<p><code>textarea</code> 的内容尺寸受到换行和滚动条影响。设置 <code>max-block-size</code> 后，超过上限的内容应通过滚动查看；不要隐藏溢出导致用户看不到已输入文字：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">textarea</span><span class="hljs-selector-class">.auto-grow</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">3</span>lh;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">12</span>lh;
  <span class="hljs-attribute">overflow-y</span>: auto;
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}
</code></pre></div>
<p><code>lh</code> 等相对单位的具体效果取决于字体和行高。字体加载完成后，文本换行和控件尺寸可能再次变化；首屏表单应避免尺寸变化遮挡提交按钮或把焦点附近内容突然推走。性能和体验上，CSS 自适应并不意味着浏览器不会重新计算布局，超长内容仍要限制长度和测量成本。</p>
<p>如果内容是用户可见的富文本或评论，尺寸策略不能替代输入长度限制、服务端校验和安全渲染。一个 textarea 的高度变大不会改变其提交值，也不会自动清理 HTML、限制 Unicode 字符或防止恶意超长请求。</p>
<h2>select 的自适应有特殊边界</h2>
<p>对 <code>select</code> 使用 content sizing 时，控件可能根据当前选项或其内容尺寸改变宽度；选项切换后，布局可能随之变化。浏览器的原生下拉菜单在打开后通常由平台 UI 绘制，CSS 控制范围和尺寸行为不能等同于页面中的普通列表：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.language-select</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-inline-size</span>: <span class="hljs-number">8rem</span>;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">18rem</span>;
}
</code></pre></div>
<p>如果选项名称来自翻译资源，德语、阿拉伯语或长地区名称可能让选择框变宽。应设置最小和最大尺寸，并测试文本截断、焦点和键盘选择。不要为了完全控制下拉菜单而随便用 div 重写原生 select；自定义组合框需要重新实现键盘、焦点、读屏和移动端交互。</p>
<h2>和 <code>width: fit-content</code>、JavaScript 自动高度不是一回事</h2>
<p><code>width: fit-content</code> 是通用盒模型尺寸函数，处理的是元素盒子的可用空间；<code>field-sizing: content</code> 针对表单控件的固有尺寸策略。两者可以组合，但不互相替代：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tag-input</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">inline-size</span>: fit-content;
  <span class="hljs-attribute">min-inline-size</span>: <span class="hljs-number">6rem</span>;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">100%</span>;
}
</code></pre></div>
<p>JavaScript 方案仍有适用场景，例如需要把尺寸同步给 Canvas、向服务端报告可见行数，或兼容不支持新属性的浏览器。它必须在 <code>input</code>、字体变化、容器尺寸变化和组件销毁时正确维护，不能简单设置 <code>height: auto</code> 后读取一次 <code>scrollHeight</code> 就宣布完成。CSS 和脚本同时控制同一尺寸时，应明确谁是最终来源，避免循环读写布局。</p>
<h2>布局、焦点和无障碍不能被自适应破坏</h2>
<p>输入内容变化时控件尺寸改变，可能让下面的内容移动，造成阅读位置跳动或让键盘焦点附近的操作按钮离开视线。应把可变输入放在合理的布局区域，设置上限，并在真实长文本、粘贴、多行翻译和文字放大下验收。性能优化不能只看 CSS 代码量，还要测量布局移动和输入响应。</p>
<p>控件仍需有 label、错误提示、焦点样式和可操作名称。尺寸变大不代表屏幕阅读器会自动知道“内容已变多”，也不代表错误提示出现在正确位置。验证错误时应使用 <code>aria-describedby</code>、原生约束校验或框架的明确状态，而不是让红色边框和控件高度变化承担唯一信息。</p>
<p>键盘用户输入换行、删除内容、切换选项和按 Tab 时，焦点不能因为尺寸变化被移除或被滚动容器裁剪。移动端还要测试软键盘、视觉视口和页面滚动；<code>field-sizing</code> 不会自动解决键盘遮挡或固定底部操作栏的问题。</p>
<h2>渐进增强和兼容回退</h2>
<p><code>field-sizing</code> 是较新的 CSS 能力，目标浏览器、WebView 和嵌入式环境的支持需要查兼容性数据。旧浏览器会忽略未知属性并继续使用默认尺寸，因此基础表单仍应可用：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.comment</span> {
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">2.5rem</span>;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">14rem</span>;
  <span class="hljs-attribute">overflow</span>: auto;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">field-sizing</span>: content) {
  <span class="hljs-selector-class">.comment</span> {
    <span class="hljs-attribute">field-sizing</span>: content;
  }
}
</code></pre></div>
<p>回退不一定需要立即写一套复杂 JavaScript。如果固定尺寸在旧环境中仍能完成输入，优先保持简单；只有产品明确要求自动增长时，才增加脚本，并为它设置长度上限、节流/合并测量和清理逻辑。不要让不支持 CSS 属性的环境因为缺少脚本而丢失输入或提交能力。</p>
<h2>验收和选型</h2>
<p>使用 <code>field-sizing</code> 前，应回答三个问题：控件是否真的需要随内容变化、变化是否会推动重要布局、旧环境是否能接受固定尺寸。验收至少包括：</p>
<ul>
<li>空值、单行、长单词、长 URL、emoji 和多行粘贴；</li>
<li>中英文、RTL、字体加载完成和文字放大；</li>
<li>textarea 达到最大尺寸后的滚动、焦点和错误提示；</li>
<li>select 选项切换后的布局稳定性和原生键盘操作；</li>
<li>旧浏览器、移动端软键盘、SSR 首屏和表单 reset；</li>
<li>超长输入的前端限制、网络请求大小和服务端校验。</li>
</ul>
<p><code>field-sizing</code> 让控件的尺寸意图可以交给 CSS 表达，但它不是自动布局的万能修复。把内容上限、布局稳定性、无障碍、兼容回退和服务端输入约束一起设计，才能让自适应表单真正改善体验。</p>`};export{e as default};