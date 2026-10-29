var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>插件就是给整个 Vue 应用加能力的东西。它可以是一个带 <code>install(app, options)</code> 方法的对象，也可以直接是一个 <code>(app, options) =&gt; {}</code> 函数，通过 <code>app.use()</code> 安装。Vue Router、Pinia 都是插件。</p>
<p>在 <code>install</code> 里通常做这几件事：用 <code>app.component</code> 注册全局组件，用 <code>app.directive</code> 注册指令，用 <code>app.provide</code> 提供一个服务，或者往 <code>app.config.globalProperties</code> 上挂模板里能直接用的方法。</p>
<p>暴露服务时更推荐 <code>provide</code>，组件里再用 <code>inject</code> 或封装好的 <code>useXxx()</code> 拿到。这样类型推导更好，测试时也容易替换。</p>
<p>有两点要注意。同一个插件对同一个应用重复 <code>app.use</code> 只会装一次，不能靠再装一次来改配置。状态要在 <code>install</code> 里创建，不要放在模块级变量里，因为服务端渲染时每个请求都是新的应用实例，模块级状态会被所有用户共用。</p>
</blockquote>
<h2>写一个格式化插件</h2>
<p>下面的插件提供金额和日期格式化，用工厂函数接收语言和币种：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// plugins/format.js</span>
<span class="hljs-keyword">import</span> { inject } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">FormatKey</span> = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;format&#x27;</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createFormat</span>(<span class="hljs-params">{ locale = <span class="hljs-string">&#x27;zh-CN&#x27;</span>, currency = <span class="hljs-string">&#x27;CNY&#x27;</span> } = {}</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">install</span>(<span class="hljs-params">app</span>) {
      <span class="hljs-keyword">const</span> money = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(locale, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, currency });
      <span class="hljs-keyword">const</span> service = {
        <span class="hljs-attr">money</span>: <span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> money.<span class="hljs-title function_">format</span>(n),
        <span class="hljs-attr">date</span>: <span class="hljs-function">(<span class="hljs-params">d</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(locale).<span class="hljs-title function_">format</span>(d),
      };
      app.<span class="hljs-title function_">provide</span>(<span class="hljs-title class_">FormatKey</span>, service);
      app.<span class="hljs-property">config</span>.<span class="hljs-property">globalProperties</span>.<span class="hljs-property">$money</span> = service.<span class="hljs-property">money</span>; <span class="hljs-comment">// 可选：模板中直接用</span>
    },
  };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useFormat</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> service = <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">FormatKey</span>);
  <span class="hljs-keyword">if</span> (!service) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;未安装 format 插件&#x27;</span>);
  <span class="hljs-keyword">return</span> service;
}
</code></pre></div>
<p>安装和使用：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">import</span> { createApp } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-title class_">App</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./App.vue&#x27;</span>;
<span class="hljs-keyword">import</span> { createFormat } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./plugins/format&#x27;</span>;

<span class="hljs-title function_">createApp</span>(<span class="hljs-title class_">App</span>).<span class="hljs-title function_">use</span>(<span class="hljs-title function_">createFormat</span>({ <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;USD&#x27;</span> })).<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { useFormat } from &#x27;@/plugins/format&#x27;;
const { money } = useFormat();
&lt;/script&gt;

&lt;template&gt;
  &lt;span&gt;{{ money(42) }}&lt;/span&gt;
&lt;/template&gt;
</code></pre></div>
<p>为什么不直接导出一个插件对象，而要用 <code>createFormat()</code> 包一层？因为每调用一次工厂函数，就得到一份独立的配置和服务。同一个页面上有两个应用，一个用人民币、一个用美元，也互不影响。<code>service</code> 是在 <code>install</code> 里创建的，跟着具体的应用实例走，也就不会出现服务端渲染时多个请求共用一份状态的问题。</p>
<p><code>useFormat</code> 里找不到服务就直接报错，是为了让“忘了装插件”这种错误尽早暴露，而不是在某处悄悄得到 <code>undefined</code>。</p>
<h2>插件加的全局监听怎么清理</h2>
<p>插件如果给 <code>window</code> 加了 <code>resize</code> 之类的监听，应用卸载后监听还在。Vue 3.5 起可以用 <code>app.onUnmount</code> 在应用卸载时清理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">install</span>(<span class="hljs-params">app</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">onResize</span> = (<span class="hljs-params"></span>) =&gt; { <span class="hljs-comment">/* ... */</span> };
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize);
  app.<span class="hljs-title function_">onUnmount</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize));
}
</code></pre></div>
<h2>在 TypeScript 里声明 globalProperties</h2>
<p>往 <code>globalProperties</code> 上挂了 <code>$money</code>，TypeScript 默认不知道它的类型，模板里会报错。要补一个类型声明：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;vue&#x27;</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">ComponentCustomProperties</span> {
    <span class="hljs-attr">$money</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">n</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>;
  }
}
</code></pre></div>
<h2>常见追问</h2>
<p><strong>Vue Router、Pinia、vue-i18n 都是插件吗？</strong></p>
<blockquote>
<p>是。它们都通过 <code>app.use</code> 安装，并用 provide 把实例暴露给组件。</p>
</blockquote>
<p><strong>和 Vue 2 的插件有什么区别？</strong></p>
<blockquote>
<p>Vue 2 的 <code>Vue.use</code> 修改的是全局构造函数，会影响页面上所有应用。Vue 3 的插件安装在具体的 <code>app</code> 实例上，各个应用互不干扰。</p>
</blockquote>`};export{e as default};