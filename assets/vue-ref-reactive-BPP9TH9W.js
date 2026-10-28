var e={answerHtml:`<h2>简答</h2>
<p>ref 可以包装任意类型，通过 .value 读写，在模板中自动解包；reactive 只接受对象，返回 Proxy，直接访问属性。reactive 对象被整体替换或直接解构后会失去响应性，解构需要用 toRefs。官方推荐默认使用 ref。大型数据不需要深层响应时，用 shallowRef 或 shallowReactive。</p>
<p>ref 与 reactive 都可以参与 Vue 响应式，但它们提供的入口不同。ref 是一个带 value 属性的容器，适合原始值，也可以保存对象；reactive 则返回对象的响应式代理，通过属性读取与修改建立关系。</p>
<p>选择时可以先问：需要管理一个经常整体替换的值，还是一组希望保持同一容器身份的对象属性？这比简单规定“数字用 ref，对象必须用 reactive”更准确。</p>
<h2>ref 可以包装原始值，也可以包装对象</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { reactive, ref, toRef, toRefs, isRef } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> count = <span class="hljs-title function_">ref</span>(<span class="hljs-number">0</span>);
count.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count.<span class="hljs-property">value</span>); <span class="hljs-comment">// 1</span>

<span class="hljs-keyword">const</span> user = <span class="hljs-title function_">ref</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> });
<span class="hljs-keyword">const</span> previous = user.<span class="hljs-property">value</span>;
user.<span class="hljs-property">value</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Chen&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-property">value</span>.<span class="hljs-property">name</span>); <span class="hljs-comment">// Chen</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-property">value</span> === previous); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>在 JavaScript 中，读写 ref 通常通过 .value。对象值默认会经过深层响应式转换，整个对象可以通过给 .value 赋新值替换，订阅这个入口的逻辑也能感知变化。</p>
<p>reactive 需要对象类型，例如普通对象、数组、Map 或 Set，不能直接把一个数字代理成响应式变量。它返回的 Proxy 与原对象身份不同，应一致使用代理入口，而不是一会儿改代理、一会儿绕过它改原对象。</p>
<h2>普通解构只读取当时的值</h2>
<p>下面继续使用前面的导入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> });
<span class="hljs-keyword">const</span> { <span class="hljs-attr">count</span>: detached } = state;
<span class="hljs-keyword">const</span> linked = <span class="hljs-title function_">toRef</span>(state, <span class="hljs-string">&#x27;count&#x27;</span>);
<span class="hljs-keyword">const</span> fields = <span class="hljs-title function_">toRefs</span>(state);

state.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(detached); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(linked.<span class="hljs-property">value</span>); <span class="hljs-comment">// 2</span>
linked.<span class="hljs-property">value</span> = <span class="hljs-number">3</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(state.<span class="hljs-property">count</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fields.<span class="hljs-property">name</span>.<span class="hljs-property">value</span>); <span class="hljs-comment">// Lin</span>
</code></pre></div>
<p>detached 保存的是解构时取出的普通数字，没有建立一个自动读回 state.count 的通道。toRef 则创建与指定属性连接的 ref，读取和写入会对应到源属性；toRefs 为对象当前可枚举的属性建立类似连接。</p>
<p>这不是所有解构都会深拷贝。若解构得到的本来是响应式子对象引用，对那个子对象的属性修改仍然可能被追踪；丢失的是通过原属性重新取值的连接。如果原来的子对象属性被替换，旧引用也不会自动变成新对象。</p>
<p>toRefs 只处理调用时可枚举属性，后面新加的名字不会自动出现在已经返回的结果里。已知某个字段需要单独连接时，toRef 通常更直接。</p>
<h2>整个 reactive 变量重新赋值，是普通变量替换</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> current = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });
<span class="hljs-keyword">const</span> originalProxy = current;
current = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(originalProxy.<span class="hljs-property">count</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(current.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>赋值给 current 本身不是一个被 Vue 拦截的响应式属性写入。其他地方已经保存的 originalProxy 仍然指向旧代理，之前围绕旧对象建立的关系不会仅因变量名重用就全部迁移。</p>
<p>这不表示任何对象都不能被替换。通过 ref.value，或通过另一个响应式对象的属性替换对象，都有可追踪的入口。若选择 reactive 管理固定容器，也可以修改其属性；关键是让变化发生在使用者实际订阅的那条路径上。</p>
<h2>解包规则与访问位置有关</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> nested = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">amount</span>: <span class="hljs-title function_">ref</span>(<span class="hljs-number">1</span>) });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(nested.<span class="hljs-property">amount</span>); <span class="hljs-comment">// 1</span>

<span class="hljs-keyword">const</span> values = <span class="hljs-title function_">reactive</span>([<span class="hljs-title function_">ref</span>(<span class="hljs-number">1</span>)]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isRef</span>(values[<span class="hljs-number">0</span>])); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values[<span class="hljs-number">0</span>].<span class="hljs-property">value</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>深层 reactive 普通对象属性访问可以自动解包 ref，但响应式数组元素和 Map 等集合中的 ref 并不按同样方式自动解包。不能因为对象属性里省略过 .value，就把所有位置都按同一规则处理。</p>
<p>模板也有自己的解包规则，常见的顶层 ref 绑定可以直接使用。普通对象里嵌套的 ref、运算表达式和最终文本插值又可能表现不同，因此不要把“模板里永远不需要 .value”作为通用结论。</p>
<p>Vue 3.5 的 script setup 对 defineProps 解构还提供编译期转换，这是特定语法的编译能力，不是 JavaScript 普通解构从此变成响应式。阅读旧例子时应把版本与来源区分开。</p>
<h2>浅层 API 是另一种有意的边界</h2>
<p>shallowRef 主要追踪 .value 替换，不会把内部对象都做同样的深层转换；shallowReactive 主要处理根层属性。它们适合明确由外部库管理或按不可变方式更新的大结构，但不是解决不明原因更新问题的快捷开关。</p>
<p>把深层、浅层和原始对象随意混用，容易让同一结构的不同路径具有不同追踪行为。应先定义谁负责内部变更，再决定是否只需要追踪外层引用变化。</p>
<h2>选择依据仍然是数据流</h2>
<p>ref 对单个值、组合函数返回值和整体替换很方便；reactive 对一组相关属性也很自然。两者都不会自动把派生结果、用户草稿和服务端数据同步成正确的业务状态。</p>
<p>排查“不更新”时，可以依次确认：读取的是 ref.value 还是普通拷贝，修改经过哪一个代理，是否替换了普通变量，访问位置是否自动解包，以及是否用了浅层 API。明确这些路径，比反复在 ref 与 reactive 之间切换更有效。</p>`};export{e as default};