var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户第一次打开页面时，<code>useFetch</code> 或 <code>useAsyncData</code> 在服务端执行，拿到的数据会被序列化，放进页面里一起发给浏览器，这份数据叫 payload。客户端 hydration 时直接读 payload，所以不会再请求一遍。之后在客户端导航到这个页面，请求才在浏览器里发。</p>
<p>数据是按 key 存的。<code>useFetch</code> 会根据 URL 和选项自动生成 key，<code>useAsyncData</code> 建议自己传 key。相同 key 的调用共享同一份 <code>data</code>、<code>error</code> 和 <code>status</code>。</p>
<p>Nuxt 4 有两个默认值要记住：<code>data</code> 和 <code>error</code> 初始是 <code>undefined</code>；<code>deep</code> 默认是 <code>false</code>，也就是 <code>data</code> 是 shallowRef，改它内部的属性不会触发更新。</p>
<p>另外，共享同一个 key 的几处调用，<code>handler</code>、<code>deep</code>、<code>transform</code>、<code>pick</code>、<code>getCachedData</code>、<code>default</code>、<code>middleware</code> 这些选项要保持一致，不一致开发环境会警告。</p>
</blockquote>
<h2>先看基本用法</h2>
<p>下面是一个文章详情页，根据路由参数请求文章。</p>
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
<p>URL 写成了一个函数，而不是直接拼好的字符串。这样路由参数变了，<code>useFetch</code> 能感知到并自动重新请求。<code>pick</code> 只保留需要的三个字段，因为 payload 会跟着 HTML 发给浏览器，字段越少页面越小。</p>
<h2>为什么不会重复请求</h2>
<p>如果在组件里直接调用请求函数，服务端渲染时执行一次，客户端 hydration 时组件再执行一次，接口就被打了两遍。<code>useFetch</code> 的做法是：服务端请求完，把结果按 key 存进 payload；客户端执行到同一个调用时，先按 key 去 payload 里找，找到了就直接用。</p>
<p>所以 key 很重要。两处调用 key 一样，就会拿到同一份数据；这也是为什么共享 key 的调用选项必须一致，否则两处对“这份数据长什么样”的理解就不一样了。</p>
<h2>status 有哪些取值</h2>
<table><thead><tr><th>值</th><th>含义</th></tr></thead><tbody><tr><td><code>idle</code></td><td>还没执行，例如设置了 <code>immediate: false</code>，或 <code>server: false</code> 时的服务端渲染阶段</td></tr><tr><td><code>pending</code></td><td>请求中</td></tr><tr><td><code>success</code></td><td>成功</td></tr><tr><td><code>error</code></td><td>失败</td></tr></tbody></table>
<p>用了 <code>immediate: false</code> 时，请求不会马上发，状态停在 <code>idle</code>。模板如果只处理了 <code>pending</code>、<code>error</code> 和有数据三种情况，这时就会什么都不显示，所以要记得处理 <code>idle</code>。</p>
<h2>常用选项</h2>
<ul>
<li><code>lazy: true</code>：不阻塞导航，先渲染页面再加载数据，需要自己显示加载状态。</li>
<li><code>server: false</code>：只在客户端请求，适合依赖浏览器信息或不需要 SEO 的数据。</li>
<li><code>watch: [source]</code>：额外指定变化时重新请求的来源。</li>
<li><code>dedupe</code>：已经有请求在进行，又被触发一次时怎么办。默认 <code>&#x27;cancel&#x27;</code> 取消旧请求，<code>&#x27;defer&#x27;</code> 则复用进行中的请求。</li>
<li><code>getCachedData(key, nuxtApp)</code>：自定义缓存读取，返回非空值时跳过请求。</li>
</ul>
<h2>在别的组件里读同一份数据</h2>
<p>既然数据按 key 存，别处也可以按 key 拿：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> { data } = <span class="hljs-title function_">useNuxtData</span>(<span class="hljs-string">&#x27;post-42&#x27;</span>);
</code></pre></div>
<p>比如列表页已经加载过这篇文章，详情页可以先把缓存显示出来，再去刷新。</p>
<h2>权限边界要注意什么</h2>
<p>服务端请求时，<code>useFetch</code> 调用自己的内部 API 会转发一部分请求头，但调用第三方接口不会自动带上 cookie。<code>/server/api</code> 里的接口仍然要自己校验身份，不能因为是“服务端调用”就放松。</p>
<p>还有一点，payload 里的数据最终会发到浏览器，任何人打开页面源码都能看到。所以不要把敏感字段放进去，这也是要用 <code>pick</code> 精简字段的另一个原因。</p>
<h2>常见追问</h2>
<p><strong><code>useFetch</code> 和 <code>$fetch</code> 有什么区别？</strong></p>
<blockquote>
<p><code>$fetch</code> 只是一个请求函数。在组件里直接调用，服务端和客户端会各请求一次。<code>useFetch</code> 在它外面加了 payload 复用和状态管理。所以渲染要用的数据用 <code>useFetch</code>，点击按钮提交数据这种事件处理里用 <code>$fetch</code>。</p>
</blockquote>
<p><strong>为什么改了 <code>data.value.title</code>，界面没变？</strong></p>
<blockquote>
<p>因为 Nuxt 4 里 <code>data</code> 默认是 shallowRef，只有整体替换才会触发更新。要么写 <code>data.value = { ...data.value, title }</code>，要么在选项里设置 <code>deep: true</code>。</p>
</blockquote>`};export{e as default};