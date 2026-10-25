var e={answerHtml:`<p>mixin 可以把数据、方法与生命周期选项混入组件，但一个成员究竟来自哪个 mixin、是否与组件自己的名字冲突，往往要沿隐式合并规则追踪。多个 mixin 之间还可能互相依赖某个没有显式传入的字段。</p>
<p>组合式函数把这种关系改成普通函数调用：输入是什么、返回哪些状态与操作，可以在调用位置直接看到。它不是只把代码搬到另一个文件，而是让复用边界更明确。</p>
<h3>每次调用可以创建独立状态</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// useCounter.js</span>
<span class="hljs-keyword">import</span> { ref } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useCounter</span>(<span class="hljs-params">initialValue = <span class="hljs-number">0</span></span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(initialValue)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;初始值必须是有限数字&#x27;</span>);
  <span class="hljs-keyword">const</span> count = <span class="hljs-title function_">ref</span>(initialValue);
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
    count.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">reset</span>(<span class="hljs-params"></span>) {
    count.<span class="hljs-property">value</span> = initialValue;
  }
  <span class="hljs-keyword">return</span> { count, increment, reset };
}
</code></pre></div>
<p>这个实现接收普通有限数字，count 在函数内部创建，因此调用两次会得到两份计数。返回普通对象中的 ref，调用方可以解构并起别名，而不丢掉对那个 ref 的连接。</p>
<p>如果把 count 移到模块顶层，两个调用者可能共享同一个实例，这就是另一种状态所有权。它可以是有意设计，但不应在重构时无意改变，SSR 中还要考虑模块可能跨请求存活。</p>
<h3>有资源的逻辑也把清理放在一起</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// useWindowWidth.js</span>
<span class="hljs-keyword">import</span> { onMounted, onUnmounted, ref } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useWindowWidth</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> width = <span class="hljs-title function_">ref</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">update</span>(<span class="hljs-params"></span>) {
    width.<span class="hljs-property">value</span> = <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>;
  }

  <span class="hljs-title function_">onMounted</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">update</span>();
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, update);
  });
  <span class="hljs-title function_">onUnmounted</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, update));

  <span class="hljs-keyword">return</span> { width };
}
</code></pre></div>
<p>这份组合函数要求在合适的组件 setup 上下文中调用，让 mounted 与 unmounted 属于当前实例。浏览器读取延后到 mounted，避免在服务端 setup 时直接访问 window。</p>
<p>它没有为所有调用者共享一份监听器；多个实例调用会分别建立与清理自己的监听。如果项目需要集中订阅，应明确设计共享服务或作用域，而不是以为 use 前缀自动意味着单例。</p>
<h3>调用位置可以看清每份来源</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- CounterWidget.vue --&gt;
&lt;script setup&gt;
import { useCounter } from &#x27;./useCounter.js&#x27;;
import { useWindowWidth } from &#x27;./useWindowWidth.js&#x27;;

const { count: first, increment: incrementFirst } = useCounter();
const { count: second, increment: incrementSecond } = useCounter(10);
const { width } = useWindowWidth();
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;button type=&quot;button&quot; @click=&quot;incrementFirst&quot;&gt;甲：{{ first }}&lt;/button&gt;
    &lt;button type=&quot;button&quot; @click=&quot;incrementSecond&quot;&gt;乙：{{ second }}&lt;/button&gt;
    &lt;p&gt;窗口宽度：{{ width }}&lt;/p&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>重名的 count 和 increment 可以在解构时明确改名，不需要依赖 mixin 选项覆盖规则。读到组件时，也能直接知道宽度来源于哪个函数、计数是否独立。</p>
<p>如果组合函数返回一个 reactive 对象，再直接解构其中原始值，可能失去连接。返回 ref、使用 toRefs 或保留对象访问方式，是需要有意识选择的接口形式，而不是所有返回值都天然适合任意解构。</p>
<h3>输入是值还是响应式来源，也应写进契约</h3>
<p>某些组合函数需要持续跟随 ref 或 getter，而不只是采用初始化快照。可以按 Vue 版本使用 toValue 等接口，并在被追踪的计算中读取：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// useTrimmedText.js</span>
<span class="hljs-keyword">import</span> { computed, toValue } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useTrimmedText</span>(<span class="hljs-params">source</span>) {
  <span class="hljs-keyword">const</span> text = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> value = <span class="hljs-title function_">toValue</span>(source);
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;输入必须解析为字符串&#x27;</span>);
    <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
  });
  <span class="hljs-keyword">return</span> { text };
}
</code></pre></div>
<p>这份接口接受字符串、字符串 ref 或返回字符串的 getter。toValue 位于 computed 内部，所以 getter 读取的响应式依赖可以参与追踪；如果先在外面读成普通字符串，再交给 computed，就可能只留下旧快照。</p>
<p>不是所有组合函数都应该接受三种输入形式。只需要初始配置的函数，可以清楚声明它不会追踪后续变化；需要动态输入的函数，则应明确怎样传递与取消相应工作。</p>
<h3>作用域与异步任务不能隐藏起来</h3>
<p>Vue 中组合函数的调用限制主要来自组件实例与响应式作用域，不是照搬 React 按 Hook 调用位置关联状态的机制。涉及生命周期的组合函数，通常要在 setup 期间同步调用，才能正确关联当前实例。</p>
<p>纯粹创建 ref、computed 的逻辑可以有其他使用方式，但脱离组件时也需要考虑谁负责停止相关副作用。effectScope 与 onScopeDispose 可以帮助组织独立作用域，不能把一个永久运行的订阅包装成函数后就忘记管理。</p>
<p>如果函数建立请求、侦听或计时器，应同时说明输入改变时怎样使旧任务失效、卸载时怎样结束、结果是否可能过期。把这些细节全部藏在一个宽泛的 useData 名字里，会让组合式代码重新变得隐晦。</p>
<h3>与普通工具函数和状态库的边界</h3>
<p>不使用响应式或生命周期的格式化、计算函数，通常不需要叫 composable，也不必套一个 use 前缀。模块级共享数据、多页面持久状态和跨标签页同步，则可能需要更明确的 store 或服务边界。</p>
<p>组合函数的返回对象也不一定要暴露所有内部 ref。只读视图、显式更新方法或更小的接口，能够表达调用方真正被允许做什么。</p>
<p>它相对 mixin 的维护优势，是来源显式、依赖可传入、类型更容易推导，并且能独立测试。代码行数减少只是副产品，真正应保留的是清楚的数据流与生命周期。</p>`};export{e as default};