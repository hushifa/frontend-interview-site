var e={answerHtml:`<p>“复制一个对象”需要先说清复制哪一层。把一个对象赋给另一个变量没有创建新对象；展开语法会创建新的外层对象，但里面的子对象通常还是原来的；更深的复制还要决定怎样处理循环、特殊类型和共享引用。</p>
<p>不同方案不是按“浅拷贝低级、深拷贝高级”排列的。应该根据后续是否需要共享状态、输入包含哪些类型，以及复制成本来选择。</p>
<h3>浅拷贝为何仍会改到原来的子对象</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = { <span class="hljs-attr">child</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> } };
<span class="hljs-keyword">const</span> shallow = { ...source };
<span class="hljs-keyword">const</span> deep = <span class="hljs-title function_">structuredClone</span>(source);

shallow.<span class="hljs-property">child</span>.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(source.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(deep.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>);   <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>shallow 与 source 是不同的外层对象，但两者的 child 指向同一个对象。执行 shallow.child.count = 2 改的是这个共享子对象，所以 source 也观察到变化。</p>
<p>如果执行的是 shallow.child = { count: 2 }，那只是替换 shallow 自己的 child 属性，不会同时替换 source.child。理解“修改引用所指的对象”和“给某个属性重新赋值”的区别，比只记一句“浅拷贝会影响原对象”更准确。</p>
<p>对象展开和 Object.assign 会读取相应的可枚举自身属性，包括适用的 Symbol 键，但不会把继承属性、不可枚举属性或完整的属性描述符原样复制过去。读取访问器可能执行 getter；Object.assign 向目标赋值时还可能触发目标 setter，而对象展开创建普通数据属性的方式不同。它们不是没有副作用的内存快照。</p>
<h3>深拷贝还必须保留对象图的关系</h3>
<p>假设左右两个属性指向同一个人，这种共享关系也属于数据结构的一部分。一个正确处理对象图的复制，不应该把它们随意变成两个互不相关的人。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> person = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小林&#x27;</span> };
<span class="hljs-keyword">const</span> original = { <span class="hljs-attr">left</span>: person, <span class="hljs-attr">right</span>: person };
original.<span class="hljs-property">self</span> = original;

<span class="hljs-keyword">const</span> copy = <span class="hljs-title function_">structuredClone</span>(original);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy !== original); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">left</span> !== person); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">left</span> === copy.<span class="hljs-property">right</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">self</span> === copy); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>structuredClone 在复制过程中追踪已经处理过的对象，所以能处理循环引用，也能在复制结果内部保留这种共享身份关系。在这个例子中，结果与原来的普通对象分离，但不是把图中每一次出现的引用都机械变成不同对象。</p>
<p>手写递归复制如果没有记录访问过的对象，遇到循环可能无限递归；只打断循环却不复用对应副本，又可能破坏共享关系。因此复杂数据的深拷贝不能只用“遍历 key 再递归”概括。</p>
<h3>structuredClone 支持很多数据，但不是任何实例</h3>
<p>它可以处理普通数据对象、数组，以及 Date、Map、Set、ArrayBuffer、TypedArray 等受支持类型。具体的宿主对象支持范围要结合运行环境确认。</p>
<p>函数、DOM 节点以及 Symbol 值等不能按普通结构化克隆方式复制，遇到不可克隆值可能抛出 DataCloneError。对象里藏着一个回调，也不能因为最外层看起来只是普通对象就忽略它。</p>
<p>自定义原型链、属性描述符和类的私有元素不会原样保存。一个依赖原型方法或私有状态的类实例，复制出部分公开数据后，不能继续假定它仍然是具备原行为的同类实例。RegExp 的 lastIndex 等状态也不是全部保留。</p>
<p>读取普通可枚举访问器属性时可能执行 getter，但结果中并不是原封不动地安装同一个访问器。需要精确保留描述符、原型或重建资源时，应设计专门的复制或序列化协议，而不是把 structuredClone 当成万能对象复制器。</p>
<h3>transfer 是转移使用权，原数据会失效</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">4</span>);
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer)[<span class="hljs-number">0</span>] = <span class="hljs-number">7</span>;

<span class="hljs-keyword">const</span> moved = <span class="hljs-title function_">structuredClone</span>({ buffer }, { <span class="hljs-attr">transfer</span>: [buffer] });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buffer.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(moved.<span class="hljs-property">buffer</span>.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(moved.<span class="hljs-property">buffer</span>)[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 7</span>
</code></pre></div>
<p>普通克隆 ArrayBuffer 会获得独立的数据副本；transfer 则转移这个可转移资源，原 buffer 变为 detached，不能再当作仍然持有四字节数据的缓冲区使用。持有原缓冲区的其他视图也会受影响。</p>
<p>这有助于某些跨 Worker 等场景减少数据复制，但调用方必须允许原资源失去可用性。transfer 列表不是普通的“额外复制字段”，需要把资源放在要传递的数据结构中，并确保它确实支持转移。SharedArrayBuffer 也不能照搬为可转移 ArrayBuffer，二者的共享语义不同。</p>
<h3>JSON 序列化能不能当深拷贝</h3>
<p>仅当数据明确符合所需的 JSON 模型时，<code>JSON.parse(JSON.stringify(value))</code> 才可能满足有限需求。它做的是序列化与重新解析，不是通用的对象图复制：</p>
<table><thead><tr><th>原数据</th><th>常见变化或限制</th></tr></thead><tbody><tr><td>对象属性值为 undefined、函数或 Symbol</td><td>该属性通常被省略</td></tr><tr><td>数组中相应的不可表示值</td><td>通常变为 null</td></tr><tr><td>NaN、Infinity</td><td>变为 null</td></tr><tr><td>Date</td><td>通常通过 toJSON 变成字符串</td></tr><tr><td>Map、Set</td><td>默认不会按集合条目完整序列化</td></tr><tr><td>循环引用</td><td>抛错</td></tr><tr><td>BigInt</td><td>默认序列化会抛错</td></tr></tbody></table>
<p>JSON 还可能调用对象自定义的 toJSON，所以结果取决于对象主动提供的表示。原来两个字段指向同一个对象的关系，也不会仅靠普通 JSON 往返自动保留下来。</p>
<h3>更新界面状态，往往只需要复制修改路径</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = {
  <span class="hljs-attr">user</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小林&#x27;</span>, <span class="hljs-attr">preferences</span>: { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> } },
  <span class="hljs-attr">courses</span>: [<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>],
};

<span class="hljs-keyword">const</span> next = {
  ...state,
  <span class="hljs-attr">user</span>: {
    ...state.<span class="hljs-property">user</span>,
    <span class="hljs-attr">preferences</span>: { ...state.<span class="hljs-property">user</span>.<span class="hljs-property">preferences</span>, <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;dark&#x27;</span> },
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(state.<span class="hljs-property">user</span>.<span class="hljs-property">preferences</span>.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(next.<span class="hljs-property">user</span>.<span class="hljs-property">preferences</span>.<span class="hljs-property">theme</span>); <span class="hljs-comment">// dark</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(next.<span class="hljs-property">courses</span> === state.<span class="hljs-property">courses</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>只修改主题时，为通往该字段的路径建立新对象即可，未变化的课程数组可以继续共享。前提是后续遵守不直接修改共享旧数据的约定。</p>
<p>每次都深拷贝全部状态既增加时间和内存成本，又会让本来没变化的对象身份全部改变，影响基于引用的更新判断。要把数据交给隔离计算、避免两边互相修改时，可以选择合适的深拷贝；要维护不可变界面状态时，通常优先考虑结构共享和明确的修改路径。</p>`};export{e as default};