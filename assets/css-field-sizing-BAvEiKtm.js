var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>field-sizing: content</code> 让 textarea、input、select 按内容计算固有尺寸，替代过去监听 <code>input</code> 读 <code>scrollHeight</code> 的脚本。</li>
<li>它不是无限增长，最终尺寸仍受 <code>min-*</code>/<code>max-*</code>、父容器、字体和换行约束，必须给上限。</li>
<li>默认值 <code>fixed</code> 保持原有尺寸，适合需要对齐的表单；<code>content</code> 只用在确实需要随内容变化的控件上。</li>
<li>不支持的浏览器会忽略它，基础表单仍应能用，所以按渐进增强处理。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.comment</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">3</span>lh;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">12</span>lh;
  <span class="hljs-attribute">inline-size</span>: <span class="hljs-built_in">min</span>(<span class="hljs-number">100%</span>, <span class="hljs-number">42rem</span>);
  <span class="hljs-attribute">overflow-y</span>: auto;
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}
</code></pre></div>
<h2>fixed 和 content 表达不同的产品意图</h2>
<p>登录框、表格筛选和多字段横排适合 <code>fixed</code>；备注、标签输入、选项长度差异大的控件适合 <code>content</code>。自适应宽度的输入框在输入过程中会推动旁边的按钮，工具栏和表格列里应保持稳定尺寸：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.search-input</span> {
  <span class="hljs-attribute">field-sizing</span>: content;
  <span class="hljs-attribute">min-inline-size</span>: <span class="hljs-number">12rem</span>;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">32rem</span>;
}

<span class="hljs-selector-class">.settings-form</span> <span class="hljs-selector-pseudo">:is</span>(<span class="hljs-selector-tag">input</span>, <span class="hljs-selector-tag">select</span>) {
  <span class="hljs-attribute">field-sizing</span>: fixed;
  <span class="hljs-attribute">inline-size</span>: <span class="hljs-number">100%</span>;
}
</code></pre></div>
<h2>textarea 和 select 的边界</h2>
<p>textarea 达到 <code>max-block-size</code> 后应滚动查看，不能隐藏溢出。字体加载完成后换行可能变化，首屏表单要避免尺寸变化推走提交按钮。尺寸策略也不能替代长度限制和服务端校验。</p>
<p>select 会按当前选项宽度变化，翻译后的长选项可能把它撑宽，所以同样要设最小和最大尺寸。原生下拉菜单打开后由平台绘制，不要为了控制尺寸用 div 重写 select，否则要自己补键盘、焦点、读屏和移动端交互。</p>
<h2>和 fit-content、JavaScript 自动高度的区别</h2>
<p><code>width: fit-content</code> 是通用盒尺寸函数；<code>field-sizing</code> 改的是表单控件自身的固有尺寸，两者可以组合。JavaScript 方案仍适合要兼容旧浏览器或把行数同步给其他逻辑的场景，但要在输入、字体变化、容器变化和卸载时维护；CSS 和脚本同时控制同一尺寸时，要明确谁说了算。</p>
<h2>无障碍与布局稳定</h2>
<p>控件变大不会让读屏器知道“内容变多”，错误提示仍要用 <code>aria-describedby</code> 或原生约束校验表达。尺寸变化不能让焦点附近的操作离开视线，也不会解决移动端软键盘遮挡。</p>
<h2>兼容回退</h2>
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
<p>固定尺寸在旧环境里能完成输入，就不必补脚本。验收覆盖空值、长单词和 URL、多行粘贴、RTL、文字放大、达到上限后的滚动与焦点、select 切换后的布局，以及表单 reset。</p>`};export{e as default};