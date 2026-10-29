var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>声明合并就是同一个名字声明了好几次，TypeScript 把它们拼成一个。最常见的是同名 <code>interface</code>，成员会合到一起；同名属性的类型必须相同，同名方法会变成重载，后写的重载排在前面。<code>namespace</code> 还能和同名的函数、类、枚举合并，给它们加静态成员。</p>
<p>在此基础上可以扩展别人的类型。<code>declare module &#x27;./x&#x27;</code> 给已有模块补类型，叫模块增补，它只能改已有的导出，不能新增顶层导出。<code>declare global</code> 用来在模块文件里扩展全局类型，比如给 <code>Window</code> 加字段。</p>
<p>有用的地方是给库预留的扩展点补字段，比如 Vue 的 <code>ComponentCustomProperties</code>、Express 的 <code>Request</code>。</p>
<p>最要注意的是，这些扩展都只是类型。运行时的实现得另外写，还要通过副作用导入确保它真的执行了。另外带运行时代码的 <code>namespace</code> 不能被直接擦掉，开启 <code>erasableSyntaxOnly</code> 或用 Node.js 直接运行时会报错。</p>
</blockquote>
<h2>同名 interface 会合成一个</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">PanelOptions</span> {
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">PanelOptions</span> {
  <span class="hljs-attr">width</span>: <span class="hljs-built_in">number</span>;
}
<span class="hljs-keyword">const</span> <span class="hljs-attr">panel</span>: <span class="hljs-title class_">PanelOptions</span> = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;阅读设置&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">320</span> };
</code></pre></div>
<p>两段 <code>PanelOptions</code> 分开写，用的时候却要求同时有 <code>title</code> 和 <code>width</code>，因为编译器把它们合并了。要是第二段也写了 <code>title: number</code>，就会报错，同名属性的类型必须一致。</p>
<h2>函数和 namespace 合并</h2>
<p>想给一个函数挂上 <code>version</code> 这样的静态属性，老写法是用同名 <code>namespace</code>：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">formatLabel</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
}
<span class="hljs-keyword">namespace</span> <span class="hljs-title class_">formatLabel</span> {
  <span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> version = <span class="hljs-string">&#x27;1.0.0&#x27;</span>;
}
</code></pre></div>
<p>这样写类型上没问题，可 <code>namespace</code> 不是纯类型，它会被编译成一个立即执行函数，给函数对象赋值。所以只删类型的工具处理不了它：开启 <code>erasableSyntaxOnly</code>（TS 5.8+）时报 <code>TS1294</code>，Node.js 直接运行也会失败。换成下面这种只用普通 JS 的写法就没问题：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> formatLabel = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>(
  <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>) =&gt;</span> value.<span class="hljs-title function_">trim</span>(),
  { <span class="hljs-attr">version</span>: <span class="hljs-string">&#x27;1.0.0&#x27;</span> },
);
</code></pre></div>
<p>只有类型的 <code>namespace</code> 和 <code>declare namespace</code> 可以直接擦掉，不受这个限制。</p>
<h2>模块增补：补了类型，实现呢</h2>
<p>下面给一个已有的 <code>Counter</code> 类补一个 <code>reset</code> 方法，分三个文件来看。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// counter.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  value = <span class="hljs-number">0</span>;
  <span class="hljs-title function_">increment</span>(): <span class="hljs-built_in">void</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
  }
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// counter-reset.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Counter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span>;

<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Counter</span> {
    <span class="hljs-title function_">reset</span>(): <span class="hljs-built_in">void</span>;
  }
}

<span class="hljs-title class_">Counter</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">reset</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = <span class="hljs-number">0</span>;
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// main.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Counter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-string">&#x27;./counter-reset.js&#x27;</span>;

<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>();
counter.<span class="hljs-title function_">increment</span>();
counter.<span class="hljs-title function_">reset</span>();
</code></pre></div>
<p><code>counter-reset.ts</code> 做了两件事：<code>declare module</code> 里那段告诉编译器 <code>Counter</code> 多了个 <code>reset</code>，下面那行给原型赋值才是真正的实现。</p>
<p>现在试着删掉 <code>main.ts</code> 里的 <code>import &#x27;./counter-reset.js&#x27;</code>。类型检查照样通过，因为增补的声明在整个项目里都可见；可运行时实现那段没有执行，<code>counter.reset()</code> 就会报“不是函数”。所以补类型的同时，必须确认实现文件被导入了。</p>
<p>还有一个容易漏的条件：增补文件自己必须是模块，也就是有 <code>import</code> 或 <code>export</code>。否则 <code>declare module &#x27;./counter.js&#x27;</code> 会被当成声明一个全新的模块，而不是给原有模块补充。</p>
<h2>扩展全局类型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// globals.d.ts</span>
<span class="hljs-keyword">export</span> {};
<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">global</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Window</span> {
    <span class="hljs-attr">appVersion</span>?: <span class="hljs-built_in">string</span>;
  }
}
</code></pre></div>
<p><code>export {}</code> 让这个文件成为模块，这样才能用 <code>declare global</code>。写完以后 <code>window.appVersion</code> 不再报错，但这只是告诉编译器“它可能存在”，值要在别的代码里真正赋上去。</p>
<h2>什么时候该用，什么时候不该用</h2>
<p>给库预留的扩展点补字段是正当用法，比如 Vue 的 <code>ComponentCustomProperties</code>、Express 的 <code>Request</code>。不要用增补去掩盖版本不兼容：库已经删掉了某个方法，你把类型补回来，错误只是推迟到了运行时。全局扩展影响整个项目，也容易和别的库冲突，能不用就少用。</p>
<h2>常见追问</h2>
<p><strong><code>type</code> 能合并吗？</strong></p>
<blockquote>
<p>不能。同名的 <code>type</code> 会报重复标识符的错误，这也是它和 interface 的区别之一，见<a href="/questions/ts-interface-type/">《type 和 interface 有哪些区别？》</a>。</p>
</blockquote>
<p><strong>类和接口能合并吗？</strong></p>
<blockquote>
<p>能。同名的 interface 会给类的实例类型补成员，但它不提供实现，跟模块增补一样，需要另外给原型或实例赋值。</p>
</blockquote>`};export{e as default};