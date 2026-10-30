var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Vue SSR 的页面先由服务端渲染出 HTML，浏览器拿到后，客户端代码不会重新创建 DOM，而是把组件状态和事件接到已有的 DOM 上，这叫水合（hydration）。前提是客户端第一次渲染的结果要和服务端的 HTML 一样，对不上就是水合不匹配，控制台会出现 <code>Hydration ... mismatch</code> 的警告。</p>
<p>Vue 官方文档列了三个最常见的原因：模板里的 HTML 嵌套不合法，比如 <code>&lt;p&gt;</code> 里放 <code>&lt;div&gt;</code>，浏览器解析时把结构改了；渲染时用了随机值，两边各算一次结果不同；服务端和浏览器时区不同，转换本地时间得到的文字不一样。另外两边拿到的数据不同、渲染时读了 <code>window</code> 或 <code>localStorage</code>，也会造成不一致。</p>
<p>排查先看开发环境的控制台。Vue 会打印出是哪个元素、是文本、子节点、class、style 还是属性不一致，并列出服务端渲染了什么、客户端期望什么。生产构建默认不带这些细节，Vue 3.4 起可以用编译期开关 <code>__VUE_PROD_HYDRATION_MISMATCH_DETAILS__</code> 打开。再对比“查看网页源代码”看到的服务端 HTML，就能定位是哪个输入两边不一样。</p>
<p>修复原则是让两端首次渲染的输入一致：数据由服务端取好并序列化给客户端，随机 ID 用 <code>useId()</code>，只有浏览器才有的内容用 <code>v-if</code> 加 <code>onMounted</code> 在挂载后再显示。Vue 3.5 起，确实无法避免的单个差异可以加 <code>data-allow-mismatch</code> 抑制警告，但不能用它掩盖结构问题。</p>
</blockquote>
<h2>水合不匹配是怎么发生的</h2>
<p>Vue SSR 的基本流程见<a href="/questions/render-nuxt-vue-ssr/">《Nuxt 和 Vue SSR 是怎样工作的？》</a>：服务端用 <code>createSSRApp</code> 和 <code>renderToString</code> 生成 HTML，客户端同样用 <code>createSSRApp</code> 创建应用，挂载时复用已有的 DOM。同一份组件代码在服务端执行一次、在浏览器又执行一次，两次的输出必须相同。</p>
<p>为什么会不同？因为两次执行的环境不一样。服务端在 Node.js 里，有自己的时区、语言和执行时间；浏览器在用户电脑上，能读到 <code>window</code>、<code>localStorage</code>。只要渲染结果依赖了这些不一样的东西，两边就对不上。</p>
<p>先看时区这个最隐蔽的例子。同一个时间戳，在服务器和用户浏览器里格式化成本地时间：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> createdAt = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">UTC</span>(<span class="hljs-number">2026</span>, <span class="hljs-number">9</span>, <span class="hljs-number">30</span>, <span class="hljs-number">16</span>, <span class="hljs-number">30</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">formatLocal</span>(<span class="hljs-params">timestamp, timeZone</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
    timeZone,
    <span class="hljs-attr">hour</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
    <span class="hljs-attr">minute</span>: <span class="hljs-string">&#x27;2-digit&#x27;</span>,
    <span class="hljs-attr">hour12</span>: <span class="hljs-literal">false</span>,
  }).<span class="hljs-title function_">format</span>(timestamp);
}

<span class="hljs-keyword">const</span> serverText = <span class="hljs-title function_">formatLocal</span>(createdAt, <span class="hljs-string">&#x27;UTC&#x27;</span>); <span class="hljs-comment">// 服务器常用 UTC</span>
<span class="hljs-keyword">const</span> clientText = <span class="hljs-title function_">formatLocal</span>(createdAt, <span class="hljs-string">&#x27;Asia/Shanghai&#x27;</span>); <span class="hljs-comment">// 用户在北京时间</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(serverText); <span class="hljs-comment">// 16:30</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(clientText); <span class="hljs-comment">// 00:30</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(serverText === clientText ? <span class="hljs-string">&#x27;一致&#x27;</span> : <span class="hljs-string">&#x27;不一致&#x27;</span>); <span class="hljs-comment">// 不一致</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(createdAt).<span class="hljs-title function_">toISOString</span>()); <span class="hljs-comment">// 2026-10-30T16:30:00.000Z</span>
</code></pre></div>
<p>服务端渲染出 16:30，浏览器水合时算出的是第二天 00:30，文本不同，就会出现文本不匹配。这个问题在开发者自己电脑上经常复现不了，因为本地开发时服务端和浏览器在同一台机器上，时区一样。</p>
<p>最后一行的 ISO 字符串不依赖时区，两边算出来一定相同。所以常见改法是：首次渲染用不依赖环境的格式，或者干脆由服务端算好文字传给客户端；需要显示用户本地时间时，在 <code>onMounted</code> 里再换成本地格式。官方文档的建议也是，本地时间的转换应该只在客户端做。</p>
<h2>先看控制台怎么报</h2>
<p>开发环境下，Vue 遇到不匹配会用 <code>console.warn</code> 打印具体信息，例如：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">[Vue warn]: Hydration text content mismatch on &lt;span&gt;
  - rendered on server: 16:30
  - expected on client: 00:30
</code></pre></div>
<p>警告的类型直接告诉你方向。<code>text content mismatch</code> 是文本不同，通常是时间、随机数、数据不同；<code>node mismatch</code> 和 <code>children mismatch</code> 是节点结构不同，先怀疑 HTML 嵌套不合法或者 <code>v-if</code> 两边条件不同；<code>class</code>、<code>style</code>、<code>attribute mismatch</code> 是属性不同，常见于根据 <code>window.innerWidth</code> 或用户偏好设置的 class。所有不匹配处理完以后，还会有一条 <code>Hydration completed but contains mismatches.</code> 的错误。</p>
<p>生产构建默认不输出这些详细警告，只剩最后那条错误。线上环境才能复现时，可以在构建配置里打开开关。Vue 文档给的 Vite 写法如下，它会增加包体积，官方建议只在调试时打开：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">define</span>: {
    <span class="hljs-attr">__VUE_PROD_HYDRATION_MISMATCH_DETAILS__</span>: <span class="hljs-string">&#x27;true&#x27;</span>,
  },
});
</code></pre></div>
<p>拿到警告以后，打开“查看网页源代码”，那是服务端返回的原始 HTML，没有被客户端改过。在里面找到报错的元素，和警告里客户端期望的内容对比，就知道是哪个值两边不一样，再顺着这个值找到它依赖的输入。</p>
<h2>几类原因怎样修</h2>
<p>HTML 嵌套不合法是 Vue 文档举的第一个例子。模板里写了 <code>&lt;p&gt;&lt;div&gt;hi&lt;/div&gt;&lt;/p&gt;</code>，服务端照原样输出成字符串，浏览器解析时遇到 <code>&lt;div&gt;</code> 会先结束 <code>&lt;p&gt;</code>，实际 DOM 变成 <code>&lt;p&gt;&lt;/p&gt;&lt;div&gt;hi&lt;/div&gt;&lt;p&gt;&lt;/p&gt;</code>。Vue 拿自己的虚拟 DOM 去比，结构对不上。这类问题只能改模板，让结构合法，比如把外层 <code>&lt;p&gt;</code> 换成 <code>&lt;div&gt;</code>。<code>&lt;a&gt;</code> 里套 <code>&lt;a&gt;</code> 也属于这一类。</p>
<p>随机值和自增 ID 的问题，官方给了两个办法：用 <code>v-if</code> 加 <code>onMounted</code>，让依赖随机值的部分只在客户端渲染；或者用支持种子的随机数生成器，把种子序列化到页面里，让两边用同一个种子。表单的 <code>id</code>、<code>aria-*</code> 需要唯一 ID 时，用 <code>useId()</code>，官方保证它生成的 ID 在服务端和客户端渲染中保持一致。</p>
<p>浏览器专属的内容，比如读 <code>localStorage</code> 里的主题、根据屏幕宽度决定布局，首次渲染要用两端都一样的默认值。<code>onMounted</code> 在 SSR 时不会执行，只在客户端挂载以后执行，所以在里面读浏览器状态、再更新界面，不会参与水合比对：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref, onMounted } from &#x27;vue&#x27;;

const isClient = ref(false);
const theme = ref(&#x27;light&#x27;); // 服务端和客户端首次渲染都用默认值

onMounted(() =&gt; {
  isClient.value = true;
  theme.value = localStorage.getItem(&#x27;theme&#x27;) ?? &#x27;light&#x27;;
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div :class=&quot;theme&quot;&gt;
    &lt;span v-if=&quot;isClient&quot;&gt;{{ new Date().toLocaleTimeString() }}&lt;/span&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre></div>
<p>两边数据不同时，要检查数据是不是在服务端取了一次、客户端又重新请求了一次。正确的做法是服务端把渲染用的状态序列化进 HTML，客户端直接拿来初始化，不在首次渲染前重新请求。Nuxt 文档说明，<code>useFetch</code>、<code>useAsyncData</code> 会把服务端请求到的数据放进 payload 转给客户端，水合时不再重复请求。</p>
<h2>无法避免的差异怎样抑制</h2>
<p>Vue 3.5 起，可以在元素上加 <code>data-allow-mismatch</code>，抑制预期之内的不匹配警告。它的值可以限定允许哪种不匹配：<code>text</code>、<code>children</code>（只针对直接子节点）、<code>class</code>、<code>style</code>、<code>attribute</code>，不写值表示全部允许：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">data-allow-mismatch</span>=<span class="hljs-string">&quot;text&quot;</span>&gt;</span>{{ updatedAt.toLocaleString() }}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
</code></pre></div>
<p>这只是不再警告，不是修复。为什么不能拿它处理结构问题？因为不匹配时 Vue 会尝试自动恢复，把服务端渲染的节点丢掉，按客户端的结果重新挂载。官方说大多数情况下应用还能正常工作，但丢弃和重建节点会带来性能损失。所以它只适合时间戳这类单个文本的差异，嵌套不合法之类的问题还是要改模板。</p>
<p>React 的水合不匹配原理相同，处理方式见<a href="/questions/render-hydration/">《Hydration mismatch 为什么发生，应该怎样修复？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么本地开发没问题，上线后才报水合不匹配？</strong></p>
<blockquote>
<p>本地开发时服务端和浏览器在同一台电脑上，时区、语言、时间几乎一样。上线后服务器常用 UTC，用户在各地，两边环境才真正分开。另外浏览器插件也可能改了 DOM。排查时可以固定服务端时区和语言来复现，用无痕模式排除插件。</p>
</blockquote>
<p><strong><code>onMounted</code> 里读 <code>window</code> 和直接在 <code>setup</code> 里读，有什么区别？</strong></p>
<blockquote>
<p><code>setup</code> 顶层的代码在服务端和客户端都会执行，服务端没有 <code>window</code>，直接读会报错；就算加了判断，客户端首次渲染读到的值也和服务端不同，会造成不匹配。<code>onMounted</code> 在 SSR 时不会调用，只在客户端水合完成后执行，在里面改状态只是一次普通的更新。</p>
</blockquote>
<p><strong>水合不匹配会影响用户吗？</strong></p>
<blockquote>
<p>会。Vue 会丢掉不匹配的节点重新挂载，这部分相当于在客户端重新渲染，有性能损失。官方建议在开发阶段就把不匹配全部消除，而不是依赖自动恢复。</p>
</blockquote>`};export{e as default};