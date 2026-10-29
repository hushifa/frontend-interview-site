var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>每个元素都是一个盒子，从里到外是内容区、内边距、边框和外边距。两种盒模型的区别在于，<code>width</code> 到底量的是哪一部分。</p>
<p>默认的 <code>content-box</code> 叫标准盒模型，<code>width</code> 只是内容区的宽度。写了 <code>width: 200px</code> 再加内边距和边框，盒子实际会比 200px 宽。<code>border-box</code> 里，<code>width</code> 包含了内边距和边框，盒子就是 200px，内容区自己变窄。</p>
<p>外边距在两种模式下都不算在 <code>width</code> 里。</p>
<p>项目里通常全局设成 <code>border-box</code>，这样写多少就是多少，算布局时不用再加加减减。</p>
</blockquote>
<h2>同样的样式，两种模式差多少</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.box</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">200px</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">20px</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">5px</span> solid;
}
</code></pre></div>
<p>在 <code>content-box</code> 下，内容区是 200px。左右内边距一共 40px，左右边框一共 10px，所以盒子总宽是 200 + 40 + 10 = 250px。</p>
<p>在 <code>border-box</code> 下，盒子总宽就是 200px。内边距和边框从里面扣，内容区剩下 200 − 40 − 10 = 150px。</p>
<p>那内边距和边框加起来比 <code>width</code> 还大呢？<code>border-box</code> 下内容区宽度变成 0，不会是负数，盒子会被撑到内边距加边框的宽度。</p>
<h2>为什么项目里都全局设 border-box</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css">*,
*<span class="hljs-selector-pseudo">::before</span>,
*<span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>想象一个两栏布局，每栏 <code>width: 50%</code>，再各加 <code>padding: 16px</code>。在 <code>content-box</code> 下，每栏都比 50% 宽，两栏加起来超出父元素，第二栏就掉到下一行去了。用 <code>border-box</code>，内边距算在 50% 里面，两栏刚好放下。</p>
<h2>写了 width，为什么最终尺寸还是不对</h2>
<p><code>min-width</code>、<code>max-width</code> 也按 <code>box-sizing</code> 来解释，和 <code>width</code> 一样。</p>
<p>flex 和 grid 的项目尺寸会被容器重新分配，<code>width</code> 只是一个参考值，最后多宽要看容器怎么分。</p>
<p>内容过长也会撑开盒子，比如一个很长的网址。这时可以加 <code>min-width: 0</code> 或者 <code>overflow-wrap: anywhere</code>。</p>
<p>还有行内元素，比如 <code>&lt;span&gt;</code>，设置 <code>width</code> 和 <code>height</code> 都不生效。要先改成 <code>inline-block</code> 或块级元素。</p>
<h2>常见追问</h2>
<p><strong>怪异模式下的盒模型是什么样的？</strong></p>
<blockquote>
<p>页面缺少 DOCTYPE 时，浏览器会进入怪异模式，兼容很老的页面写法。这时部分元素会按类似 <code>border-box</code> 的方式计算宽度。所以现代页面开头都要写 <code>&lt;!DOCTYPE html&gt;</code>，避免进入怪异模式。</p>
</blockquote>`};export{e as default};