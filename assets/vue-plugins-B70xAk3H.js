var e={answerHtml:`<h2>简答</h2>
<ul>
<li>插件可以是 <code>{ install(app, options) {} }</code> 对象，也可以直接是 <code>(app, options) =&gt; {}</code> 函数。</li>
<li><code>install</code> 中常做的事：<code>app.component</code> 注册组件、<code>app.directive</code> 注册指令、<code>app.provide</code> 提供服务、<code>app.config.globalProperties</code> 添加模板可用的全局方法。</li>
<li>推荐用 <code>provide</code> 暴露服务，组件通过 <code>inject</code> 或封装好的 <code>useXxx()</code> 获取，比 <code>globalProperties</code> 更利于类型推导和测试。</li>
<li>同一个插件对同一个应用重复调用 <code>app.use</code> 只会安装一次，不能借此修改配置。</li>
<li>状态在 <code>install</code> 中创建，不要放在模块级变量里；SSR 中每个请求都是新的应用实例，模块级状态会被所有用户共享。</li>
</ul>
<h2>示例：格式化服务</h2>
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
<p>用 <code>createFormat()</code> 工厂函数返回插件，每次调用都得到独立的配置，适合同一页面有多个应用实例的情况。</p>
<h2>清理资源</h2>
<p>插件如果注册了全局监听（例如 <code>window</code> 的 <code>resize</code>），Vue 3.5 起可以用 <code>app.onUnmount</code> 在应用卸载时清理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">install</span>(<span class="hljs-params">app</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">onResize</span> = (<span class="hljs-params"></span>) =&gt; { <span class="hljs-comment">/* ... */</span> };
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize);
  app.<span class="hljs-title function_">onUnmount</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize));
}
</code></pre></div>
<h2>TypeScript 中声明 globalProperties</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;vue&#x27;</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">ComponentCustomProperties</span> {
    <span class="hljs-attr">$money</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">n</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>;
  }
}
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>Vue Router、Pinia、vue-i18n 都是插件吗？是，它们都通过 <code>app.use</code> 安装，并用 provide 暴露实例。</li>
<li>和 Vue 2 的区别？Vue 2 的 <code>Vue.use</code> 修改全局构造函数，影响页面上所有应用；Vue 3 的插件安装在具体的 <code>app</code> 实例上。</li>
</ul>`};export{e as default};