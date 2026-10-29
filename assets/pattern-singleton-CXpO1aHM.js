var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面上的登录弹窗，不管点多少次“登录”按钮，都应该只有一个，不能每点一次就新建一个叠在上面。保证某个东西全局只有一份、大家用的是同一个，这就是单例模式。</p>
<p>实现思路是把创建好的实例缓存起来。第一次调用时创建并保存，之后再调用直接返回保存的那个。常见写法有两种：一种是用闭包保存实例，返回一个 <code>getInstance</code> 函数；另一种是在 class 上用静态属性保存。创建推迟到第一次使用时才发生，叫惰性单例，弹窗这类不一定用到的东西适合这样做。</p>
<p>在现代前端里，更常见的单例其实是 ES 模块。一个模块不管被 <code>import</code> 多少次，在同一个页面的模块图里只会执行一次，所以 <code>export const store = createStore()</code> 导出的就是所有地方共享的同一个对象，不需要再写单例模式。</p>
<p>要注意“只有一份”的前提。打包出了两份同一个库、微前端的多个子应用各自加载、或者服务端渲染时多个请求共用一个模块，都可能让“单例”变成多份或者被不该共享的人共享。服务端渲染时，模块级的单例会被所有用户的请求共用，存用户数据会串号。</p>
</blockquote>
<h2>两种实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createSingleton</span>(<span class="hljs-params">factory</span>) {
  <span class="hljs-keyword">let</span> instance;
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getInstance</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (instance === <span class="hljs-literal">undefined</span>) instance = <span class="hljs-title function_">factory</span>();
    <span class="hljs-keyword">return</span> instance;
  };
}

<span class="hljs-keyword">let</span> created = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> getDialog = <span class="hljs-title function_">createSingleton</span>(<span class="hljs-function">() =&gt;</span> {
  created += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">open</span>: <span class="hljs-literal">false</span> };
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getDialog</span>() === <span class="hljs-title function_">getDialog</span>()); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(created); <span class="hljs-comment">// 1</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ApiClient</span> {
  <span class="hljs-keyword">static</span> #instance;
  <span class="hljs-keyword">static</span> <span class="hljs-title function_">getInstance</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> (<span class="hljs-title class_">ApiClient</span>.#instance ??= <span class="hljs-keyword">new</span> <span class="hljs-title class_">ApiClient</span>());
  }
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">ApiClient</span>.<span class="hljs-title function_">getInstance</span>() === <span class="hljs-title class_">ApiClient</span>.<span class="hljs-title function_">getInstance</span>()); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>createSingleton</code> 被调用了两次 <code>getDialog()</code>，工厂函数却只执行了一次，<code>created</code> 是 1。因为 <code>instance</code> 保存在闭包里，第一次调用后就有值了，第二次直接返回。工厂函数作为参数传进来，同一个 <code>createSingleton</code> 可以把任何东西变成惰性单例，创建逻辑和“只创建一次”的逻辑分开了。</p>
<p><code>ApiClient</code> 用私有静态字段 <code>#instance</code> 保存实例，外部改不了它。不过外部仍然可以直接 <code>new ApiClient()</code> 绕过去，JS 没有私有构造函数，只能靠约定或者在构造函数里检查。</p>
<h2>为什么说 ES 模块就是单例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// store.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> store = { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> };

<span class="hljs-comment">// a.js</span>
<span class="hljs-keyword">import</span> { store } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./store.js&#x27;</span>;
store.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;

<span class="hljs-comment">// b.js</span>
<span class="hljs-keyword">import</span> { store } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./store.js&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(store.<span class="hljs-property">count</span>); <span class="hljs-comment">// a.js 先执行时是 1</span>
</code></pre></div>
<p><code>a.js</code> 和 <code>b.js</code> 拿到的是同一个 <code>store</code>，因为浏览器按 URL 缓存模块，同一个模块只执行一次。Pinia、Vuex 的 store 实例，axios 的默认实例，都是靠模块导出在全局共享的。</p>
<h2>常见追问</h2>
<p><strong>单例有什么缺点？</strong></p>
<blockquote>
<p>它相当于全局变量，任何地方都能读写，依赖关系藏在代码里，测试时上一个用例留下的状态会影响下一个。所以要提供重置方法，或者改成把实例作为参数传进去，测试时可以换成假的。</p>
</blockquote>
<p><strong>SSR 里为什么不能用模块级单例存状态？</strong></p>
<blockquote>
<p>服务端进程会处理很多用户的请求，模块只加载一次，模块级的对象就被所有请求共用，一个用户的数据可能出现在另一个用户的页面上。所以 Pinia、Vue 在 SSR 下要求每个请求创建新的 app 和 store。</p>
</blockquote>`};export{e as default};