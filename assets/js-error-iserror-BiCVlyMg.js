var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>Error.isError(value)</code> 用来判断一个值是不是真正的错误对象，用法和 <code>Array.isArray</code> 一样，返回 <code>true</code> 或 <code>false</code>。</p>
<p><code>instanceof Error</code> 只检查 <code>Error.prototype</code> 在不在对象的原型链上，这会出两种错。一是 iframe 里抛出的错误，它的原型链指向 iframe 自己的 <code>Error</code>，在父页面里判断 <code>instanceof Error</code> 得到 <code>false</code>。二是用 <code>Object.create(Error.prototype)</code> 伪造的普通对象，原型链对上了，<code>instanceof</code> 反而得到 <code>true</code>。</p>
<p><code>Error.isError</code> 检查的是 <code>Error()</code> 构造函数在对象上创建的私有数据，规范里叫 <code>[[ErrorData]]</code> 内部槽。所以跨 iframe 的真错误能认出来，伪造原型的对象认不出来。它适合在 <code>catch</code> 里判断捕获到的值，必要时包装成真正的错误。</p>
<p>要注意兼容性，MDN 把它标为 Limited availability。Chrome 134、Firefox 138 起支持，Safari 正式版还没有提供。老环境可以用 core-js 等 polyfill。</p>
</blockquote>
<h2>instanceof 为什么会判错</h2>
<p><code>instanceof</code> 的规则只有一条：沿着原型链往上找，看能不能找到 <code>Error.prototype</code>。它不关心这个对象是怎么创建出来的。下面这段代码伪造了一个“错误”：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fake = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(<span class="hljs-title class_">Error</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fake <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Error</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">toString</span>.<span class="hljs-title function_">call</span>(fake)); <span class="hljs-comment">// [object Object]</span>
<span class="hljs-keyword">const</span> tagged = { [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toStringTag</span>]: <span class="hljs-string">&#x27;Error&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">toString</span>.<span class="hljs-title function_">call</span>(tagged)); <span class="hljs-comment">// [object Error]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(tagged <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Error</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>fake</code> 从来没有经过 <code>Error</code> 构造函数，只是原型被设成了 <code>Error.prototype</code>，<code>instanceof</code> 就认它是错误。<code>Object.prototype.toString</code> 能看出它不是，可是这个方法会读 <code>Symbol.toStringTag</code>，<code>tagged</code> 只加了一个标签，就被它当成了 <code>[object Error]</code>。</p>
<p>跨 iframe 的情况正好相反。每个 iframe 有自己的一套全局对象，也就有自己的 <code>Error</code> 构造函数。iframe 里 <code>new Error()</code> 创建的对象，原型链上是 iframe 的 <code>Error.prototype</code>，跟父页面的 <code>Error.prototype</code> 不是同一个对象，所以在父页面里 <code>instanceof Error</code> 是 <code>false</code>。这类“不同的全局环境”在规范里叫 realm，判断类型时的通用问题见<a href="/questions/js-type-checking/">《怎样准确判断一个值的类型？typeof、instanceof 和 Object.prototype.toString 各有什么局限？》</a>。</p>
<h2>Error.isError 看的是什么</h2>
<p><code>Error()</code> 构造函数创建对象时，会给对象加上一份外面改不了的内部数据。<code>Error.isError</code> 只检查这份数据在不在，MDN 把这叫“品牌检查”，<code>Array.isArray</code> 也是同样的思路。</p>
<p>所以结果是这样的（浏览器代码，不在 Node 里运行）：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> iframe = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;iframe&#x27;</span>);
<span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">appendChild</span>(iframe);
<span class="hljs-keyword">const</span> <span class="hljs-title class_">FrameError</span> = iframe.<span class="hljs-property">contentWindow</span>.<span class="hljs-property">Error</span>;
<span class="hljs-keyword">const</span> error = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FrameError</span>(<span class="hljs-string">&#x27;来自 iframe&#x27;</span>);

<span class="hljs-title class_">Error</span>.<span class="hljs-title function_">isError</span>(error); <span class="hljs-comment">// true</span>
error <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Error</span>; <span class="hljs-comment">// false</span>
<span class="hljs-title class_">Error</span>.<span class="hljs-title function_">isError</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(<span class="hljs-title class_">Error</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>)); <span class="hljs-comment">// false</span>
<span class="hljs-title class_">Error</span>.<span class="hljs-title function_">isError</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>()); <span class="hljs-comment">// true</span>
<span class="hljs-title class_">Error</span>.<span class="hljs-title function_">isError</span>(<span class="hljs-string">&#x27;Error&#x27;</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>TypeError</code>、<code>RangeError</code> 这些子类都是通过 <code>Error</code> 的机制创建的，所以都返回 <code>true</code>。<code>DOMException</code> 虽然不是规范上的 <code>Error</code> 子类，MDN 说明它在品牌检查上表现得和 <code>Error</code> 一样，<code>Error.isError(new DOMException())</code> 也是 <code>true</code>。不过 MDN 的兼容表注明，Safari 预览版对 <code>DOMException</code> 返回的是 <code>false</code>。</p>
<h2>实际在哪里用</h2>
<p>最常见的是 <code>catch</code> 里。JavaScript 允许 <code>throw</code> 任何值，第三方代码可能抛出字符串或普通对象。统一成真正的错误以后，日志和监控才能稳定拿到 <code>message</code> 和 <code>stack</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">runTask</span>();
} <span class="hljs-keyword">catch</span> (caught) {
  <span class="hljs-keyword">const</span> error = <span class="hljs-title class_">Error</span>.<span class="hljs-title function_">isError</span>(caught) ? caught : <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-title class_">String</span>(caught));
  <span class="hljs-title function_">report</span>(error);
}
</code></pre></div>
<p>在微前端、iframe 嵌入、或者跨 realm 传递错误对象的场景里，<code>instanceof Error</code> 不可靠，用 <code>Error.isError</code> 才能判断准。</p>
<h2>常见追问</h2>
<p><strong>自定义的 class MyError extends Error 能被识别吗？</strong></p>
<blockquote>
<p>能。子类构造函数里调用 <code>super()</code> 时，对象是由 <code>Error</code> 的机制创建的，带有那份内部数据，所以 <code>Error.isError</code> 返回 <code>true</code>。</p>
</blockquote>
<p><strong>不支持的环境怎么办？</strong></p>
<blockquote>
<p>MDN 列出了 core-js 和 es-shims 的 <code>error.iserror</code> polyfill。</p>
</blockquote>
<p><strong>全局错误应该怎样收集？</strong></p>
<blockquote>
<p><code>window.onerror</code>、<code>unhandledrejection</code> 这些入口见<a href="/questions/js-errors-event-handling/">《同步错误、Promise 拒绝和全局异常应该怎样处理？》</a>。</p>
</blockquote>`};export{e as default};