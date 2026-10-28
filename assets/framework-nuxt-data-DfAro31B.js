var e={answerHtml:`<h2>简答</h2>
<ul>
<li>首次访问页面时，<code>useAsyncData</code> / <code>useFetch</code> 在服务端执行，结果序列化进 payload；客户端 hydration 时读取 payload，不重复请求。</li>
<li>之后在客户端导航到该页面，请求在浏览器中执行。</li>
<li>数据按 key 存储：<code>useFetch</code> 根据 URL 和选项自动生成 key，<code>useAsyncData</code> 推荐显式传 key。相同 key 的调用共享 <code>data</code>、<code>error</code>、<code>status</code>。</li>
<li>Nuxt 4 的默认值：<code>data</code> 和 <code>error</code> 初始为 <code>undefined</code>；<code>deep</code> 默认 <code>false</code>，即 <code>data</code> 是 shallowRef，修改内部属性不会触发更新。</li>
<li>共享同一 key 的调用，<code>handler</code>、<code>deep</code>、<code>transform</code>、<code>pick</code>、<code>getCachedData</code>、<code>default</code>、<code>middleware</code> 必须一致，否则开发环境会警告。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup lang=&quot;ts&quot;&gt;
const route = useRoute();

const { data: post, status, error, refresh } = await useFetch(
  () =&gt; \`/api/posts/\${route.params.id}\`,
  { pick: [&#x27;id&#x27;, &#x27;title&#x27;, &#x27;body&#x27;] },
);
&lt;/script&gt;

&lt;template&gt;
  &lt;p v-if=&quot;status === &#x27;pending&#x27;&quot;&gt;加载中…&lt;/p&gt;
  &lt;p v-else-if=&quot;error&quot;&gt;加载失败：{{ error.message }}&lt;/p&gt;
  &lt;article v-else-if=&quot;post&quot;&gt;
    &lt;h1&gt;{{ post.title }}&lt;/h1&gt;
    &lt;div&gt;{{ post.body }}&lt;/div&gt;
  &lt;/article&gt;
&lt;/template&gt;
</code></pre></div>
<ul>
<li>URL 写成 getter，路由参数变化时自动重新请求。</li>
<li><code>pick</code> 只保留需要的字段，减少 payload 体积。</li>
</ul>
<h2>status 的取值</h2>
<table><thead><tr><th>值</th><th>含义</th></tr></thead><tbody><tr><td><code>idle</code></td><td>还没执行，例如设置了 <code>immediate: false</code>，或 <code>server: false</code> 时的服务端渲染阶段</td></tr><tr><td><code>pending</code></td><td>请求中</td></tr><tr><td><code>success</code></td><td>成功</td></tr><tr><td><code>error</code></td><td>失败</td></tr></tbody></table>
<p>使用 <code>immediate: false</code> 时，模板要处理 <code>idle</code> 状态，否则页面会显示空白。</p>
<h2>常用选项</h2>
<ul>
<li><code>lazy: true</code>：不阻塞导航，先渲染页面再加载数据，需要自己显示加载状态。</li>
<li><code>server: false</code>：只在客户端请求，适合依赖浏览器信息或不需要 SEO 的数据。</li>
<li><code>watch: [source]</code>：额外指定变化时重新请求的来源。</li>
<li><code>dedupe</code>：已有请求进行中又被触发时的策略，默认 <code>&#x27;cancel&#x27;</code> 取消旧请求，<code>&#x27;defer&#x27;</code> 则复用进行中的请求。</li>
<li><code>getCachedData(key, nuxtApp)</code>：自定义缓存读取，返回非空值时跳过请求。</li>
</ul>
<h2>在别处读取同一份数据</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> { data } = <span class="hljs-title function_">useNuxtData</span>(<span class="hljs-string">&#x27;post-42&#x27;</span>);
</code></pre></div>
<p>例如列表页已经加载过文章，详情页可以先显示缓存，再刷新。</p>
<h2>权限边界</h2>
<p>服务端请求时，<code>useFetch</code> 调用内部 API 会转发部分请求头，但调用第三方接口不会自动带 cookie。<code>/server/api</code> 中的接口仍需自己校验身份，payload 中的数据会被发送到浏览器，不要放入敏感字段。</p>
<h2>常见追问</h2>
<ul>
<li><code>useFetch</code> 和 <code>$fetch</code> 的区别？<code>$fetch</code> 只是请求函数，在组件中直接调用会在服务端和客户端各请求一次；<code>useFetch</code> 负责 payload 复用和状态管理。事件处理器中提交数据用 <code>$fetch</code>。</li>
<li>为什么修改 <code>data.value.title</code> 界面没变？Nuxt 4 默认 shallowRef，整体替换 <code>data.value = {...}</code>，或设置 <code>deep: true</code>。</li>
</ul>`};export{e as default};