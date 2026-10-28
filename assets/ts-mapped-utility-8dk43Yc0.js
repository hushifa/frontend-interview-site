var e={answerHtml:`<h2>简答</h2>
<ul>
<li>映射类型用 [K in keyof T] 遍历键并变换属性，可以加减 readonly 和 ? 修饰符。</li>
<li>Partial、Required、Readonly、Pick、Omit、Record 都是基于映射类型的内置工具。</li>
<li>Omit 不检查要删除的键是否存在，联合类型上使用会丢失分支差异。</li>
<li>用 as 子句可以在映射时重命名或过滤键。</li>
</ul>
<p>一个 User 类型可能包含 ID、姓名、个人资料和内部字段。更新接口、展示组件和公开响应各需要不同部分，如果每个地方复制一份完整字段列表，很容易改了一处漏掉另一处。</p>
<p>映射类型可以从已有键和属性类型推导新结构。它表达的是“这些字段在另一个契约里是什么样”，不负责修改真实对象或执行数据转换。</p>
<h2>从遍历键到生成属性</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">BooleanFlags</span>&lt;T&gt; = {
  [<span class="hljs-title class_">Key</span> <span class="hljs-keyword">in</span> keyof T]: <span class="hljs-built_in">boolean</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Features</span> = { <span class="hljs-attr">search</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">void</span>; <span class="hljs-attr">exportFile</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">enabled</span>: <span class="hljs-title class_">BooleanFlags</span>&lt;<span class="hljs-title class_">Features</span>&gt; = {
  <span class="hljs-attr">search</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">exportFile</span>: <span class="hljs-literal">false</span>,
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(enabled.<span class="hljs-property">search</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>keyof T 提供键集合，映射逐个生成同名属性，并把属性类型统一改为 boolean。这并没有调用 Features 中的函数，只是在类型层建立一组对应开关。</p>
<p>如果写 T[Key]，则可以沿用原属性类型，再改变可选、只读等修饰符。内置的很多工具类型都基于类似思路。</p>
<h2>常见工具怎样选择</h2>
<table><thead><tr><th>工具</th><th>类型层的作用</th><th>不会自动完成的工作</th></tr></thead><tbody><tr><td>Partial</td><td>顶层属性变为可选</td><td>不会让深层字段全部可选</td></tr><tr><td>Required</td><td>去掉顶层可选修饰</td><td>不会给缺失字段填默认值</td></tr><tr><td>Readonly</td><td>增加对应只读约束</td><td>不会执行运行时深冻结</td></tr><tr><td>Pick&lt;T, K&gt;</td><td>选择指定字段</td><td>不会从对象里复制这些字段</td></tr><tr><td>Omit&lt;T, K&gt;</td><td>排除指定字段</td><td>不会删除对象上的真实字段</td></tr><tr><td>Record&lt;K, V&gt;</td><td>用键集合 K 建立值类型为 V 的结构</td><td>不会在运行时创建这些键</td></tr></tbody></table>
<p>Pick 的键需要来自目标类型，能帮助发现选取字段的拼写错误。Omit 的键约束更宽，省略一个本来不存在的名字未必报错，因此它不是万能的字段名检查器。</p>
<h2>更新接口先限制能改哪些字段</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = {
  <span class="hljs-keyword">readonly</span> <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">profile</span>: { <span class="hljs-attr">city</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">postalCode</span>: <span class="hljs-built_in">string</span> };
  <span class="hljs-attr">password</span>: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserPatch</span> = <span class="hljs-title class_">Partial</span>&lt;<span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;name&#x27;</span> | <span class="hljs-string">&#x27;profile&#x27;</span>&gt;&gt;;
<span class="hljs-keyword">const</span> <span class="hljs-attr">rename</span>: <span class="hljs-title class_">UserPatch</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> };

<span class="hljs-comment">// @ts-expect-error 更新契约没有开放 id</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">changeId</span>: <span class="hljs-title class_">UserPatch</span> = { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;user_2&#x27;</span> };

<span class="hljs-comment">// @ts-expect-error Partial 只作用于顶层，profile 一旦提供仍需完整结构</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">incompleteProfile</span>: <span class="hljs-title class_">UserPatch</span> = { <span class="hljs-attr">profile</span>: { <span class="hljs-attr">city</span>: <span class="hljs-string">&#x27;上海&#x27;</span> } };
</code></pre></div>
<p>直接 Partial 会把 ID、密码等字段也放进更新契约，可能偏离真实权限。先 Pick 出允许更新的部分，再决定是否可选，通常更贴近接口意图。</p>
<p>如果业务允许只更新 profile.city，应明确为 profile 定义部分更新结构，并说明服务器采用替换还是合并语义。类型里写了深层可选，并不自动实现递归合并算法。</p>
<p>Partial 还允许空对象。如果业务要求至少更新一个字段，应该增加类型建模或运行时检查，不能把“字段都可选”误当成“至少有一个字段”。</p>
<h2>Omit 不是运行时脱敏</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> <span class="hljs-attr">full</span>: <span class="hljs-title class_">User</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;user_1&#x27;</span>,
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>,
  <span class="hljs-attr">profile</span>: { <span class="hljs-attr">city</span>: <span class="hljs-string">&#x27;上海&#x27;</span>, <span class="hljs-attr">postalCode</span>: <span class="hljs-string">&#x27;200000&#x27;</span> },
  <span class="hljs-attr">password</span>: <span class="hljs-string">&#x27;示例占位值&#x27;</span>,
};

<span class="hljs-keyword">const</span> <span class="hljs-attr">visibleType</span>: <span class="hljs-title class_">Omit</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;password&#x27;</span>&gt; = full;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(visibleType, <span class="hljs-string">&#x27;password&#x27;</span>)); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toPublicUser</span>(<span class="hljs-params"><span class="hljs-attr">user</span>: <span class="hljs-title class_">User</span></span>): <span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;id&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>&gt; {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: user.<span class="hljs-property">id</span>, <span class="hljs-attr">name</span>: user.<span class="hljs-property">name</span> };
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(<span class="hljs-title function_">toPublicUser</span>(full)).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// id,name</span>
</code></pre></div>
<p>第一步只是让变量的静态类型不再提供 password 这个成员，真实对象仍是 full。直接 JSON.stringify 这个引用，仍可能包含敏感字段。</p>
<p>第二步真正创建了只包含白名单字段的新对象，才完成实际数据选择。对于公开响应、日志或持久化数据，应把运行时映射与类型契约共同设计，而不是靠一个 Omit 或断言完成过滤。</p>
<h2>修饰符可以明确增加或移除</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MutableRequired</span>&lt;T&gt; = {
  -<span class="hljs-keyword">readonly</span> [<span class="hljs-title class_">Key</span> <span class="hljs-keyword">in</span> keyof T]-?: T[<span class="hljs-title class_">Key</span>];
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Draft</span> = { <span class="hljs-keyword">readonly</span> <span class="hljs-attr">title</span>?: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">completed</span>: <span class="hljs-title class_">MutableRequired</span>&lt;<span class="hljs-title class_">Draft</span>&gt; = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;初稿&#x27;</span> };
completed.<span class="hljs-property">title</span> = <span class="hljs-string">&#x27;定稿&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(completed.<span class="hljs-property">title</span>); <span class="hljs-comment">// 定稿</span>
</code></pre></div>
<p>-readonly 移除只读修饰，-? 移除可选修饰。它们改变的是所生成类型的约束，不会给某个已冻结对象解除运行时冻结，也不会把缺失属性补到原对象上。</p>
<p>可选属性是否允许显式写入 undefined，还受 exactOptionalPropertyTypes 等选项影响。解释工具类型结果时，应把原属性形式与编译配置一起考虑。</p>
<h2>键重映射可以生成另一套命名接口</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Getters</span>&lt;T&gt; = {
  [<span class="hljs-title class_">Key</span> <span class="hljs-keyword">in</span> keyof T <span class="hljs-keyword">as</span> <span class="hljs-title class_">Key</span> <span class="hljs-keyword">extends</span> <span class="hljs-built_in">string</span> ? <span class="hljs-string">\`get<span class="hljs-subst">\${Capitalize&lt;Key&gt;}</span>\`</span> : <span class="hljs-built_in">never</span>]: <span class="hljs-function">() =&gt;</span> T[<span class="hljs-title class_">Key</span>];
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserGetters</span> = <span class="hljs-title class_">Getters</span>&lt;<span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;id&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>&gt;&gt;;
<span class="hljs-keyword">const</span> <span class="hljs-attr">access</span>: <span class="hljs-title class_">UserGetters</span> = {
  <span class="hljs-attr">getId</span>: <span class="hljs-function">() =&gt;</span> full.<span class="hljs-property">id</span>,
  <span class="hljs-attr">getName</span>: <span class="hljs-function">() =&gt;</span> full.<span class="hljs-property">name</span>,
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(access.<span class="hljs-title function_">getName</span>()); <span class="hljs-comment">// Lin</span>
</code></pre></div>
<p>as 子句决定输出键，never 可以排除不适用的键。这里排除非字符串键，再把 id、name 映射成 getId、getName。真正的方法仍由对象实现，类型系统没有替你生成函数体。</p>
<p>当 T 是联合类型时，还要留意工具是否按成员分发。比如普通 Omit 可能只围绕联合的公共键处理，不能默认保留每个分支所有特有字段；确实需要逐分支变换时，应显式设计分布式条件类型，并验证结果。</p>
<p>工具类型的目的应该是让契约同步变化，而不是把所有接口都从一个巨大基础类型层层变换出来。若公开模型与内部模型职责不同，适当独立定义或显式映射，往往比复杂的 Pick、Omit、Partial 叠加更清楚。</p>`};export{e as default};