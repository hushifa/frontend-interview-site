var e={answerHtml:`<h2>简答</h2>
<p>setup 最先执行，此时还没有 DOM；onMounted 时 DOM 已经挂载，可以访问模板 ref；onUpdated 在响应式更新导致 DOM 重新渲染后调用；onUnmounted 时要清理计时器和订阅。SSR 中只执行 setup，不会调用 onMounted。数据请求可以在 setup 中发起，但卸载时要取消。被 KeepAlive 缓存的组件，切换时触发 activated 和 deactivated，而不是挂载和卸载。</p>
<p>生命周期的作用是把工作放到具备正确条件的阶段。创建响应式状态不要求 DOM 已经存在，聚焦或测量元素则需要真实节点，事件和计时器还必须有明确的结束时间。</p>
<p>把所有事情都放进 mounted，或把所有清理都寄希望于页面关闭，都不能覆盖组件反复进入、条件隐藏、缓存停用和服务端渲染这些情况。</p>
<h2>setup 时建立逻辑，挂载后使用节点</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { onBeforeUnmount, onMounted, onUnmounted, ref } from &#x27;vue&#x27;;

const panel = ref(null);
const width = ref(0);
const ticks = ref(0);
let timer;

function measure() {
  if (panel.value) width.value = Math.round(panel.value.getBoundingClientRect().width);
}

onMounted(() =&gt; {
  measure();
  window.addEventListener(&#x27;resize&#x27;, measure);
  timer = setInterval(() =&gt; { ticks.value += 1; }, 1000);
});

onBeforeUnmount(() =&gt; {
  console.log(&#x27;卸载前节点仍可用：&#x27;, panel.value !== null);
});

onUnmounted(() =&gt; {
  window.removeEventListener(&#x27;resize&#x27;, measure);
  clearInterval(timer);
  console.log(&#x27;已清理面板资源&#x27;);
});
&lt;/script&gt;

&lt;template&gt;
  &lt;section ref=&quot;panel&quot; style=&quot;width: 240px&quot;&gt;
    &lt;p&gt;宽度：{{ width }}&lt;/p&gt;
    &lt;p&gt;计时次数：{{ ticks }}&lt;/p&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>script setup 的实例逻辑执行时，模板引用先是 null。mounted 后，节点已经创建并插入父容器，可以进行本例中的测量和监听。</p>
<p>代码只把窗口 resize 作为后续测量触发条件，不承诺捕获所有布局变化。字体、容器或内容改变也可能影响尺寸，真实需求可以结合 ResizeObserver 等机制，并清理对应观察器。</p>
<p>日志仅用于观察阶段。计时器与监听的清理不依赖节点仍然存在，所以可以在 onUnmounted 完成；如果第三方实例销毁需要读取尚未拆除的 DOM，可以按其约定考虑 onBeforeUnmount。</p>
<h2>挂载完成不等于所有资源都已完成</h2>
<p>mounted 会考虑同步子组件和当前 DOM 树，但不代表异步组件、Suspense 中的全部内容、图片、字体和网络请求都已经结束。</p>
<p>也要区分“插入到父容器”和“已经在整个文档中可见”。如果应用本身挂在一个脱离文档的容器中，mounted 不会替你把容器放进页面。</p>
<p>需要具体资源就绪，应等待对应协议，而不是因为 mounted 已运行就把所有几何与数据都视为最终结果。</p>
<h2>更新后读取什么，决定选哪种机制</h2>
<p>onUpdated 在 DOM 更新后运行，适合观察较宽泛的组件更新。但如果只是某个字段变化后需要测量，使用明确来源的 post 侦听或在操作后 await nextTick，通常更容易定位原因。</p>
<p>不要在 onUpdated 中无条件修改又会驱动当前组件更新的状态，否则可能形成更新循环。测量回写时也应避免不断改变被测元素本身的布局，并在值未变时减少无用写入。</p>
<p>nextTick 等待 Vue 刷新，不等于等待浏览器绘制或所有外部资源。选择钩子不是为了找到一个“万事都已完成”的时刻，而是对齐当前工作真正需要的前提。</p>
<h2>生命周期钩子需要在正确上下文注册</h2>
<p>组合式生命周期 API 通常应在组件 setup 阶段同步调用，让 Vue 知道这份回调属于哪个实例。把 onMounted 放进一个稍后才执行的普通定时器里，不能再假定它会自动关联原组件。</p>
<p>在 script setup 顶层使用受支持的编译语法时，编译器可能协助保持特定上下文，但不应把这种能力推广到任意异步回调。组合式函数若要注册生命周期，也应按调用约定使用。</p>
<h2>请求不一定都应等到 mounted 才发</h2>
<p>纯客户端组件可以在合适时机根据 ID 发请求，但 SSR 框架可能提供服务端数据加载、缓存或预取机制。如果所有首屏数据都等 mounted，服务端 HTML 就可能只有占位内容，并形成客户端请求瀑布。</p>
<p>请求跟随 prop、路由参数或查询条件变化时，watch 等明确同步机制通常比只在首次 mounted 请求一次更符合需求。还要取消失效任务或忽略旧结果，避免组件已经切换到新记录，旧请求却晚到覆盖状态。</p>
<p>组件卸载不等于远端任务被撤销。AbortController 可以与支持的客户端操作协作，服务端写入是否执行成功还需要业务协议。</p>
<h2>卸载会停止框架管理的作用，不会猜出所有外部资源</h2>
<p>Vue 会停止与组件关联的响应式作用，但手工创建的计时器、DOM 监听、第三方订阅或连接，仍应由代码主动清理。</p>
<p>setup 中同步建立的侦听通常可以与组件一起结束；稍后异步创建或独立作用域中的任务，则需要明确所有者与停止入口。不能因为调用过 watch 就把所有可能的侦听都视为自动托管。</p>
<p>如果组件处在 KeepAlive 缓存中，离开显示区域可能只是 deactivated，而不是普通卸载。需要只在活动时运行的轮询或动画，应同时处理激活、停用和最终释放。</p>
<h2>SSR 中不要制造无法按客户端钩子清理的副作用</h2>
<p>setup 可能在服务端执行，但 mounted、unmounted 等客户端生命周期不会按浏览器那样运行。把无限计时器直接建在通用 setup 顶层，再期待 onUnmounted 清除，可能在服务器上留下错误的资源生命周期。</p>
<p>浏览器专属逻辑应放在合适的客户端阶段，服务端资源则由服务器请求与数据层管理。验证时至少覆盖首次挂载、更新、卸载、再次挂载以及需要支持的缓存与 SSR 路径，才能说明组件生命周期设计完整。</p>`};export{e as default};