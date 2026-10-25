var e={answerHtml:`<p>插件适合安装一组应用级能力，例如格式化服务、路由、国际化或全局组件。它可以是一个安装函数，也可以是具有 install 方法的对象，接收 app 与调用方提供的选项。</p>
<p>插件不是给所有组件随意增加隐藏全局变量的理由。最好明确暴露一个小接口，说明配置何时生效、状态属于哪个应用、资源何时释放。</p>
<h3>通过应用级 provide 暴露服务</h3>
<p>下面示例面向 Vue 3.5 及以上，用 app.onUnmount 清理可选的浏览器监听。状态在每次 install 中创建，不放在模块级单例里。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// localePlugin.js</span>
<span class="hljs-keyword">import</span> { readonly, ref } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> localeKey = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;区域服务&#x27;</span>);
<span class="hljs-keyword">const</span> supported = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;zh-CN&#x27;</span>, <span class="hljs-string">&#x27;en-US&#x27;</span>, <span class="hljs-string">&#x27;de-DE&#x27;</span>]);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> localePlugin = {
  <span class="hljs-title function_">install</span>(<span class="hljs-params">app, options = {}</span>) {
    <span class="hljs-keyword">const</span> initial = options.<span class="hljs-property">locale</span> ?? <span class="hljs-string">&#x27;zh-CN&#x27;</span>;
    <span class="hljs-keyword">if</span> (!supported.<span class="hljs-title function_">has</span>(initial)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;不支持的区域配置&#x27;</span>);
    <span class="hljs-keyword">const</span> locale = <span class="hljs-title function_">ref</span>(initial);

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">setLocale</span>(<span class="hljs-params">value</span>) {
      <span class="hljs-keyword">if</span> (!supported.<span class="hljs-title function_">has</span>(value)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;不支持的区域配置&#x27;</span>);
      locale.<span class="hljs-property">value</span> = value;
    }

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">formatNumber</span>(<span class="hljs-params">value</span>) {
      <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(locale.<span class="hljs-property">value</span>).<span class="hljs-title function_">format</span>(value);
    }

    app.<span class="hljs-title function_">provide</span>(localeKey, { <span class="hljs-attr">locale</span>: <span class="hljs-title function_">readonly</span>(locale), setLocale, formatNumber });

    <span class="hljs-keyword">if</span> (options.<span class="hljs-property">followBrowser</span> &amp;&amp; <span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">window</span> !== <span class="hljs-string">&#x27;undefined&#x27;</span>) {
      <span class="hljs-keyword">function</span> <span class="hljs-title function_">syncLanguage</span>(<span class="hljs-params"></span>) {
        <span class="hljs-keyword">if</span> (supported.<span class="hljs-title function_">has</span>(navigator.<span class="hljs-property">language</span>)) <span class="hljs-title function_">setLocale</span>(navigator.<span class="hljs-property">language</span>);
      }
      <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;languagechange&#x27;</span>, syncLanguage);
      app.<span class="hljs-title function_">onUnmount</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;languagechange&#x27;</span>, syncLanguage));
    }
  },
};
</code></pre></div>
<p>消费者注入同一份键，读取区域并通过明确方法修改：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- LocalePanel.vue --&gt;
&lt;script setup&gt;
import { computed, inject } from &#x27;vue&#x27;;
import { localeKey } from &#x27;./localePlugin.js&#x27;;
const service = inject(localeKey, null);
if (!service) throw new Error(&#x27;需要安装区域插件&#x27;);
const selected = computed({
  get: () =&gt; service.locale.value,
  set: value =&gt; service.setLocale(value),
});
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;label&gt;区域
      &lt;select v-model=&quot;selected&quot;&gt;
        &lt;option value=&quot;zh-CN&quot;&gt;中文区域&lt;/option&gt;
        &lt;option value=&quot;en-US&quot;&gt;美国区域&lt;/option&gt;
        &lt;option value=&quot;de-DE&quot;&gt;德国区域&lt;/option&gt;
      &lt;/select&gt;
    &lt;/label&gt;
    &lt;p&gt;{{ service.formatNumber(1234.5) }}&lt;/p&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">import</span> { createApp } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-title class_">LocalePanel</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./LocalePanel.vue&#x27;</span>;
<span class="hljs-keyword">import</span> { localePlugin } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./localePlugin.js&#x27;</span>;

<span class="hljs-keyword">const</span> app = <span class="hljs-title function_">createApp</span>(<span class="hljs-title class_">LocalePanel</span>);
app.<span class="hljs-title function_">use</span>(localePlugin, { <span class="hljs-attr">locale</span>: <span class="hljs-string">&#x27;zh-CN&#x27;</span>, <span class="hljs-attr">followBrowser</span>: <span class="hljs-literal">true</span> });
app.<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>);
</code></pre></div>
<p>这个例子只演示数字格式化，不是完整国际化系统。formatNumber 在组件渲染中读取响应式 locale，选择新区域后可以重新显示对应格式；消费者无需把内部 ref 当作可随意写入的全局变量。</p>
<h3>同一插件的重复安装有明确范围</h3>
<p>Vue 会避免同一个应用重复安装同一个插件对象或函数。第二次 app.use 不应被当作更新配置的方法；需要动态配置，应像示例的 setLocale 那样提供正式接口。</p>
<p>同一个插件可以被不同应用安装。由于 locale 在 install 内部创建，两个应用可以有不同初始区域，不会因为导入了同一模块就自动共享用户状态。</p>
<p>如果每次都通过工厂产生一个新的插件对象，身份又不同，不能期待框架把所有看起来相似的对象都判为同一次安装。</p>
<h3>初始化和清理属于插件契约</h3>
<p>插件如果注册浏览器事件、创建定时器或连接外部服务，就应提供相应释放路径。当前应用 API 可以登记卸载回调，但还要考虑安装失败、应用尚未挂载或提前取消初始化等情况。</p>
<p>示例先验证配置，再建立状态和监听；浏览器专属逻辑也有环境判断。真实复杂初始化应避免执行到一半失败后留下已创建资源，必要时显式管理清理栈或可释放服务。</p>
<p>app.use 调用安装函数不等于会自动等待任意异步准备工作。若某个服务必须就绪后才能挂载，应由应用启动流程明确等待，或在组件层提供可解释的准备状态。</p>
<h3>globalProperties 适合有限的兼容接口</h3>
<p>app.config.globalProperties 可以向组件实例或模板提供全局能力，但大量隐式的 $xxx 会让依赖来源不清楚，也给单独测试组件增加负担。</p>
<p>script setup 不会因为存在全局属性，就自动在 JavaScript 作用域里多出一个同名变量。组合式代码通常更适合显式 inject 或导入清楚的服务接口。</p>
<p>TypeScript 项目还需要为公开的注入键或全局实例能力提供相应类型，但声明只描述接口，不会替代实际安装。类型补全出现一个方法，不意味着运行时插件一定已执行。</p>
<h3>SSR 与测试隔离不能依赖模块单例</h3>
<p>服务器可能为不同用户处理多个请求。如果插件把可变用户状态放在模块顶层，请求之间可能意外共享。应按应用或请求创建状态，并清楚区分可以共享的静态配置和不该共享的用户数据。</p>
<p>mounted、unmounted 等客户端生命周期不能替代服务器请求资源管理。示例在服务器不注册 window 监听，真正的服务端连接和缓存则需要自己的作用域。</p>
<p>测试时应创建独立 app，验证配置、注入、重复安装与卸载，并确认没有残留监听。对于不需要应用级安装的纯函数，直接导出通常更简单；只有确实需要统一注册或配置时，再使用插件这一层。</p>`};export{e as default};