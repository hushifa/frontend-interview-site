var e={answerHtml:`<p>“只读”必须说明限制的是哪一层。const 不允许变量改指向另一个值，某个属性的 writable:false 不允许直接给该数据属性换值，Object.freeze 限制一整个对象的普通属性结构，而 TypeScript readonly 主要在类型检查时约束写法。</p>
<p>这些限制并不自动递归到所有可达数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> item = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">nested</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } });
item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>这里 item 的 nested 属性不能被随意重新赋值，但 nested 指向的对象本身并没有被冻结，所以仍然可以修改 count。理解属性与属性值所引用的对象，是区分这些机制的关键。</p>
<h3>数据属性与访问器属性是两种描述方式</h3>
<p>数据属性直接保存 value，并使用 writable 控制是否允许普通赋值。访问器属性使用 get、set 函数读取或写入，不同时拥有 value 和 writable。两种属性都可以设置 enumerable 与 configurable。</p>
<table><thead><tr><th>描述项</th><th>控制内容</th></tr></thead><tbody><tr><td>value</td><td>数据属性当前保存的值</td></tr><tr><td>writable</td><td>数据属性能否通过相应赋值操作改变</td></tr><tr><td>get、set</td><td>访问器读取、写入时调用的函数</td></tr><tr><td>enumerable</td><td>是否参与 Object.keys 等可枚举属性操作</td></tr><tr><td>configurable</td><td>是否允许删除以及若干描述符结构变化</td></tr></tbody></table>
<p>不可枚举不等于不可访问，也不等于保密。只要知道属性名，普通读取仍然可能得到它；Reflect.ownKeys 等接口也可以发现不可枚举属性。</p>
<h3>defineProperty 的默认值容易与普通赋值混淆</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-meta">&#x27;use strict&#x27;</span>;

<span class="hljs-keyword">const</span> record = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(record, <span class="hljs-string">&#x27;id&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">7</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(record.<span class="hljs-property">id</span>); <span class="hljs-comment">// 7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(record).<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-keyword">try</span> {
  record.<span class="hljs-property">id</span> = <span class="hljs-number">8</span>;
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">deleteProperty</span>(record, <span class="hljs-string">&#x27;id&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>新属性通过 defineProperty 建立时，没有指定的 writable、enumerable、configurable 默认是 false。与此不同，给普通可扩展对象直接写 <code>record.id = 7</code>，通常会建立可写、可枚举、可配置的数据属性。</p>
<p>这里特意加了严格模式，写入不可写属性会抛错；某些非严格赋值会静默失败，不能把“没看到异常”理解成写入成功。Reflect.deleteProperty 返回是否删除成功，所以它能在这个例子中明确返回 false。</p>
<p>若 defineProperty 是修改已有属性，遗漏的描述项通常保留原状态，并不是每次调用都把所有没写的项重置为 false。这一点在分步配置属性时尤其重要。</p>
<p>configurable:false 也不等于所有内容马上完全锁死。对于仍然 writable:true 的不可配置数据属性，值仍可改变，writable 还可以进一步变为 false；但不能随意重新开启配置、改成另一种属性类型或把锁定的可写性恢复。具体修改必须满足描述符的不变量。</p>
<h3>preventExtensions、seal、freeze 逐步限制什么</h3>
<p>Object.preventExtensions 阻止新增自身属性，但已有属性仍按原来的描述符允许修改或删除。Object.seal 在阻止扩展的基础上，使已有普通属性不可配置，所以不能再随意删掉它们或改变描述符结构。</p>
<p>Object.freeze 进一步把已有数据属性设为不可写，同时保持不可扩展、不可配置。它返回原对象，不是创建一个冻结副本。普通数组被冻结后，也不能再正常添加、删除、重排元素或修改 length。</p>
<p>可以通过 Object.isExtensible、Object.isSealed、Object.isFrozen 检查对应状态。这些结果描述当前对象的相应限制，不代表整棵对象图完全不可变。</p>
<h3>冻结访问器和集合，不会冻结全部业务状态</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> stored = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> account = {
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">balance</span>() { <span class="hljs-keyword">return</span> stored; },
  <span class="hljs-keyword">set</span> <span class="hljs-title function_">balance</span>(<span class="hljs-params">value</span>) { stored = value; },
};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>(account);
account.<span class="hljs-property">balance</span> = <span class="hljs-number">10</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(account.<span class="hljs-property">balance</span>); <span class="hljs-comment">// 10</span>

<span class="hljs-keyword">const</span> cache = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>());
cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;answer&#x27;</span>, <span class="hljs-number">42</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;answer&#x27;</span>)); <span class="hljs-comment">// 42</span>
</code></pre></div>
<p>冻结后，account 的访问器定义不能随意替换，但 setter 仍然可以执行，修改它关联的外部变量；getter 的返回值也不必永远相同。</p>
<p>Map 的条目保存在其内部集合状态中，不是以普通的 &#x27;answer&#x27; 自身数据属性表示。freeze 限制 Map 对象的普通属性，并不会让 set、delete 失效。Date、类的私有元素等也可能有不等同于普通公开属性的状态，不能用 Object.isFrozen 就推断所有操作都不能改变可观察结果。</p>
<h3>readonly 与运行时保护如何配合</h3>
<p>TypeScript readonly 帮助开发阶段发现不符合接口约定的赋值。类型信息编译后通常不存在，来自 JavaScript、类型断言或其他入口的代码仍可能修改运行时对象。Readonly 默认也是对那一层属性的类型约束，不会自动深度冻结整个对象图。</p>
<p>如果需要运行时防止意外改动，可以在适当边界冻结数据；需要不可变状态更新时，也可以通过复制修改路径、共享未变部分来维护约定。二者都要与数据类型和业务规则相匹配。</p>
<p>深冻结需要处理循环引用、Symbol 键、不可枚举属性、访问器与特殊对象，不能简单遍历 Object.keys 后递归就宣称支持任意 JavaScript 值。冻结大型图还可能有明显开销，也可能误冻其他模块共享的对象。</p>
<p>实际设计中，先决定谁有写入权限、哪些数据可以共享、更新是否通过受控接口，再选择类型约束、冻结或复制策略。某个对象带有 freeze 标记，并不意味着它自然成为安全隔离边界或完整的不可变领域模型。</p>`};export{e as default};