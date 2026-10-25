var e={answerHtml:`<p>如果数据是“一个用户有 id、姓名和角色”，普通对象很自然；如果是“运行过程中不断按任意键加入、查找、删除条目”，Map 通常更合适；如果只关心“哪些值已经出现过”，就考虑 Set。</p>
<p>WeakMap 的区别不是更快或更高级，而是它不应仅因为对象被当作键，就单独阻止那个对象被回收。它解决生命周期关联问题，不是所有缓存的默认选择。</p>
<h3>Map 可以用对象做键，但比较的是身份</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = {};
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[key, <span class="hljs-number">1</span>]]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>(key)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>({}));  <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>第二次传入的是一个新建空对象，即便外观与 key 一样，也不是同一个键。如果希望按用户 ID 查询，应把稳定 ID 作为键，而不是每次临时拼出一个新对象。</p>
<p>Map 的键可以是任意值，比较使用 SameValueZero：NaN 可以匹配另一个 NaN，正负零视为同一个键，对象仍然按身份匹配。数字 1 与字符串 &#x27;1&#x27; 则是不同键。</p>
<p>普通对象的属性键只能是字符串或 Symbol。用其他值做方括号属性名时，会发生相应的键转换：数字 1 和字符串 &#x27;1&#x27; 都会落到属性 &#x27;1&#x27;，两个普通对象也可能都转成 &#x27;[object Object]&#x27;，造成覆盖。</p>
<h3>记录与动态字典，需要的接口不同</h3>
<table><thead><tr><th>需求</th><th>更直接的选择</th></tr></thead><tbody><tr><td>一组约定好的字段，频繁用 obj.name 访问</td><td>普通对象</td></tr><tr><td>任意值为键，频繁加入删除并获取条目数量</td><td>Map</td></tr><tr><td>保存不重复的值、快速表达成员关系</td><td>Set</td></tr><tr><td>给某个对象附加外部元数据，不独自延长键的生命周期</td><td>WeakMap</td></tr><tr><td>只标记对象是否属于某一集合，且不需要枚举</td><td>WeakSet</td></tr></tbody></table>
<p>Map 有 size、has、get、set、delete 与可迭代条目等接口。普通对象有原型与属性描述符机制，可以表达更丰富的对象模型，但把它当任意外部键的字典时，需要考虑继承属性和特殊属性名。</p>
<p>例如检查对象自身是否有字段，应使用 Object.hasOwn，而不把继承来的名字也算进去。Object.create(null) 可以建立没有原型的字典，但它没有普通对象继承的方法，也不因此获得 Map 的任意类型键和迭代接口。</p>
<h3>插入顺序不会随着每次访问自动刷新</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> scores = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>],
  [<span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-number">2</span>],
]);

scores.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">3</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...scores.<span class="hljs-title function_">keys</span>()].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// a,b</span>

scores.<span class="hljs-title function_">delete</span>(<span class="hljs-string">&#x27;a&#x27;</span>);
scores.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">4</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...scores.<span class="hljs-title function_">keys</span>()].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// b,a</span>
</code></pre></div>
<p>Map 按键的插入顺序迭代。更新已有键的值不会改变位置，读取也不会把它移到末尾；删除后重插才会更新顺序。这是用 Map 实现 LRU 缓存时必须主动维护的一步。</p>
<p>普通对象也有规定的属性枚举顺序，不能简单说“对象完全无序”。但整数索引形式的字符串键、其他字符串键和 Symbol 键遵循不同的次序规则，各个枚举 API 还会过滤不同属性，因此不能把它等同于 Map 的插入顺序模型。</p>
<h3>Set 去重不是按业务字段去重</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-property">size</span>); <span class="hljs-comment">// 3</span>

<span class="hljs-keyword">const</span> users = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> }, { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> }]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(users.<span class="hljs-property">size</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>数字 1、字符串 &#x27;1&#x27; 和 NaN 分别占一个成员。两个用户对象则身份不同，所以都保留。若要按 id 去重，应先定义重复时保留哪一份数据，再使用以 id 为键的 Map 等结构，而不是以为 Set 会递归比较对象内容。</p>
<p>Set 的 add 返回集合本身，delete 返回是否删除了条目；判断是否存在使用 has。它可以迭代，但不是按整数位置访问的数组，没有自然的 values[0] 或数组式索引接口。</p>
<h3>WeakMap 怎样与对象生命周期关联</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> metadata = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">register</span>(<span class="hljs-params">element, description</span>) {
  metadata.<span class="hljs-title function_">set</span>(element, { description });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">describe</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">return</span> metadata.<span class="hljs-title function_">get</span>(element)?.<span class="hljs-property">description</span>;
}

<span class="hljs-keyword">const</span> element = {};
<span class="hljs-title function_">register</span>(element, <span class="hljs-string">&#x27;编辑器容器&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">describe</span>(element)); <span class="hljs-comment">// 编辑器容器</span>
</code></pre></div>
<p>这里的 element 可以换成实际 DOM 元素等对象。元数据放在外部 WeakMap 中，不必向对象本身添加可能冲突的属性。只要代码还持有 element，就能查询元数据；当键对象不再被其他有效引用保留时，WeakMap 的这个关联不会单独阻止它被垃圾回收。</p>
<p>现代标准允许对象以及非注册 Symbol 作为弱键。普通字符串、数字不行，Symbol.for 创建的注册 Symbol 也不能按同样方式用作弱键；Symbol 弱键的实际支持仍应与目标运行环境核对。日常对象元数据场景并不需要依赖 Symbol 键。</p>
<p>WeakMap 没有 size，也不能列出所有键或条目，因为这会把垃圾回收导致的键存活变化暴露给程序。它提供已知键的 get、has、set、delete，不提供“列出当前所有还没被回收的对象”这种可预测接口。</p>
<h3>弱引用不等于所有相关对象都会立即消失</h3>
<p>如果键仍被数组、全局缓存、DOM 树或事件监听关系引用，它仍然可能存活。把元数据改存在 WeakMap，不会自动清理其他位置的强引用，也不会自动取消对象关联的定时器或请求。</p>
<p>只由弱映射关联产生的“值再引用键”循环，不应独自把键永久保留下来；但如果那个值对象也被外部代码强引用，并通过它再次到达键，就形成了另一条有效保留路径。判断泄漏需要看整个可达关系，不能只看某一个容器的名字里有没有 Weak。</p>
<p>回收时机由引擎决定，不能写测试要求“变量设为 null 后下一行 WeakMap 就删掉了”。需要主动过期、限制条目数量、遍历统计或按字符串 ID 查询的缓存，通常应使用 Map 配合显式策略。</p>
<h3>性能与序列化也要按约定处理</h3>
<p>Map 实现需要提供平均次线性的访问性能，常见实现可有很高的查找效率，但语言规范并不承诺所有引擎所有操作严格 O(1)，也不保证在每一种负载下都比对象快。先根据语义选结构，再测量真正的瓶颈。</p>
<p>普通 JSON.stringify 不会自动把 Map、Set 的内部条目变成你想要的 JSON。需要明确转换为条目数组或业务对象，再定义还原规则。Object.fromEntries 能把条目变成对象，但对象属性键的限制仍在，不能借此无损保留任意对象键的身份。</p>`};export{e as default};