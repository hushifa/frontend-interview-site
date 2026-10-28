var e={answerHtml:`<h2>简答</h2>
<p>自定义指令用于复用直接操作 DOM 的底层逻辑，例如自动聚焦、点击外部关闭、观察元素尺寸。常用钩子有 mounted、updated、beforeUnmount，绑定值变化时要在 updated 中处理，卸载时要释放监听器和观察器。用在组件上时，指令作用于组件根元素，多根组件会失效并警告。能用组件或组合式函数解决的问题，不要用指令。</p>
<p>当一段复用逻辑主要围绕“这个真实 DOM 元素怎样操作”，自定义指令通常合适。例如聚焦、接入观察器或与只接受元素的第三方工具协作。</p>
<p>如果需求是复用一块界面结构，组件更清楚；如果主要是响应式状态和业务计算，组合函数更自然。不要把请求、表单状态和一整套页面逻辑都藏进一个看似简短的 v-xxx。</p>
<h2>指令钩子拿到的是绑定元素和绑定信息</h2>
<p>mounted 可以在元素挂载后建立行为，updated 可以读取本轮绑定值，unmounted 可以释放资源。还有创建、挂载前、更新前和卸载前等钩子，应根据需要操作 DOM 的时机选择。</p>
<p>binding.value 是表达式结果，oldValue 在更新钩子中提供旧值，arg 与 modifiers 则表达参数和修饰符。updated 被调用不意味着 value 一定变化，指令应按自己的成本与契约判断是否需要重新设置。</p>
<h2>用指令管理一个尺寸观察器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vMeasure.js</span>
<span class="hljs-keyword">const</span> records = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>();

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> vMeasure = {
  <span class="hljs-title function_">mounted</span>(<span class="hljs-params">element, binding</span>) {
    <span class="hljs-keyword">const</span> record = { <span class="hljs-attr">callback</span>: binding.<span class="hljs-property">value</span>, <span class="hljs-attr">observer</span>: <span class="hljs-literal">null</span> };
    <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> current = records.<span class="hljs-title function_">get</span>(element);
      <span class="hljs-keyword">if</span> (!current || <span class="hljs-keyword">typeof</span> current.<span class="hljs-property">callback</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> rect = element.<span class="hljs-title function_">getBoundingClientRect</span>();
      current.<span class="hljs-title function_">callback</span>({ <span class="hljs-attr">width</span>: rect.<span class="hljs-property">width</span>, <span class="hljs-attr">height</span>: rect.<span class="hljs-property">height</span> });
    });
    record.<span class="hljs-property">observer</span> = observer;
    records.<span class="hljs-title function_">set</span>(element, record);
    observer.<span class="hljs-title function_">observe</span>(element);
  },
  <span class="hljs-title function_">updated</span>(<span class="hljs-params">element, binding</span>) {
    <span class="hljs-keyword">const</span> record = records.<span class="hljs-title function_">get</span>(element);
    <span class="hljs-keyword">if</span> (record) record.<span class="hljs-property">callback</span> = binding.<span class="hljs-property">value</span>;
  },
  <span class="hljs-title function_">unmounted</span>(<span class="hljs-params">element</span>) {
    records.<span class="hljs-title function_">get</span>(element)?.<span class="hljs-property">observer</span>.<span class="hljs-title function_">disconnect</span>();
    records.<span class="hljs-title function_">delete</span>(element);
  },
};
</code></pre></div>
<p>每个元素有自己的记录，更新绑定时替换回调，不重复创建观察器。回调执行时再取当前记录，卸载后记录已删除，就不继续给失效使用者写入结果。</p>
<p>WeakMap 只是管理元素与记录的关联，不能代替 observer.disconnect。观察器和其他宿主资源可能仍持有元素，资源释放必须显式完成。</p>
<h2>在组件中局部使用</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- MeasurePanel.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import { vMeasure } from &#x27;./vMeasure.js&#x27;;

const width = ref(240);
const size = ref({ width: 0, height: 0 });

function recordSize(next) {
  if (size.value.width !== next.width || size.value.height !== next.height) {
    size.value = next;
  }
}
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;div v-measure=&quot;recordSize&quot; :style=&quot;{ width: \`\${width}px\`, padding: &#x27;8px&#x27;, border: &#x27;1px solid&#x27; }&quot;&gt;
      被观察的内容
    &lt;/div&gt;
    &lt;p&gt;实际宽度：{{ size.width }}&lt;/p&gt;
    &lt;button type=&quot;button&quot; @click=&quot;width = width === 240 ? 320 : 240&quot;&gt;改变宽度&lt;/button&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>script setup 中以 v 开头的指令绑定可以被模板识别，vMeasure 对应 v-measure。也可以通过应用级 directive 注册，但没有共享需要时，局部使用更容易看出依赖。</p>
<p>测量返回的是 getBoundingClientRect 对应的几何宽高，包含边框、内边距和变换影响，不一定等于 CSS 中写的 width。结果显示在独立区域，避免直接用测量值反复改变被测元素自身尺寸形成反馈循环。</p>
<h2>更新回调与重新初始化不是一回事</h2>
<p>绑定函数可能随着父级逻辑变化。示例只更新记录中的 callback，下一次尺寸变化就使用新函数，不需要先断开再观察同一个元素。</p>
<p>如果需求是绑定更新后立即报告当前尺寸，则应明确增加一次读取；当前例子不承诺“换回调就马上触发尺寸事件”。对不同第三方库，配置变化可能确实需要重新初始化，也应在 updated 中有针对性地处理。</p>
<p>初次 ResizeObserver 通知有自己的调度时机，不能把 observe 调用完成当作同步得到最终尺寸。后续字体、内容和布局还可能变化，是否需要这些变化决定了为什么采用观察器。</p>
<h2>不要与模板争夺同一份 DOM 状态</h2>
<p>Vue 模板负责的文本、class、style 或子节点，如果被指令悄悄替换，后续 patch 可能与指令相互覆盖。指令应有明确的负责范围，避免把整个组件结构改写成框架不知道的另一棵树。</p>
<p>聚焦指令也不应在每次 updated 时无条件 focus，否则普通状态更新就可能抢走用户焦点。应按绑定变化或明确操作意图执行，而不是把“更新了”当成用户要求重新聚焦。</p>
<p>事件监听需要移除同一函数引用，观察器需要断开，第三方实例需要调用对应销毁方法。需要仍存在 DOM 才能正确释放的资源，可以根据接口选择 beforeUnmount 等更早阶段。</p>
<h2>组件边界与 SSR 需要额外考虑</h2>
<p>不建议把自定义指令直接当成深入自定义组件内部的选择器。它依赖组件根节点，多根组件或根结构变化时可能不符合预期，也不会自动知道哪个后代 input 才是目标。</p>
<p>更稳妥的方式是在需要操作的普通元素上使用指令，或让组件提供明确的 ref/方法接口。组件的 attrs 与根继承规则也不应被指令绕过。</p>
<p>服务端没有真实浏览器 DOM，普通 DOM 指令钩子不会按客户端方式执行。确实需要在 SSR 输出某些属性时，可以按 Vue 的服务端指令接口提供 getSSRProps，并保持逻辑不依赖浏览器资源。</p>
<p>验证指令时应覆盖首次挂载、绑定值变化、元素尺寸或交互变化、卸载和重新挂载。一个 mounted 能跑通，不足以证明指令在真实组件生命周期中没有重复资源或旧回调。</p>`};export{e as default};