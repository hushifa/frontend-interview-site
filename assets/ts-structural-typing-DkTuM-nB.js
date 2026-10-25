var e={answerHtml:`<p>TypeScript 主要采用结构类型：一个值只要具备目标要求的成员和相应类型，就可能与目标兼容，不必先声明“我实现了这个名字”。因此两个名称不同、字段相同的类型，通常仍能互相使用。</p>
<p>但这不是说所有多余字段都无条件接受。直接提供对象字面量时，编译器还会执行额外属性检查，帮助发现字段拼写错误。这与一般结构兼容是相关但不同的检查层次。</p>
<h3>为什么变量能传入，直接字面量却报错</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Named</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">greet</span>(<span class="hljs-params"><span class="hljs-attr">person</span>: <span class="hljs-title class_">Named</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">return</span> person.<span class="hljs-property">name</span>;
}

<span class="hljs-keyword">const</span> detailed = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;admin&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">greet</span>(detailed)); <span class="hljs-comment">// Lin</span>

<span class="hljs-comment">// @ts-expect-error 直接传入的字面量包含目标中没有声明的 role</span>
<span class="hljs-keyword">const</span> direct = <span class="hljs-title function_">greet</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;admin&#x27;</span> });

<span class="hljs-keyword">const</span> <span class="hljs-attr">narrowed</span>: <span class="hljs-title class_">Named</span> = detailed;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(narrowed).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// name,role</span>
</code></pre></div>
<p>detailed 已经是一个具有明确结构的值，它包含 Named 所需要的 name，因此可以使用。直接传入的字面量则会受到额外属性检查，在这个上下文中指出 role 不属于目标契约。</p>
<p>这不是把数据放进变量就改变了运行时内容，也不是编译器随意前后矛盾。新鲜对象字面量常常是在表达“这就是我要提供的完整参数”，多写的字段很可能是拼错，因此有更直接的检查。</p>
<p>如果调用者本来就需要传 role，应修改接口或选择正确的参数模型；不应该把中转变量当作绕过真实错误的技巧。</p>
<h3>类型标注不会删除对象里没有声明的字段</h3>
<p>上例 narrowed 的静态类型只暴露 name，但运行时仍然引用 detailed，Object.keys 依然看得到 role。把接口对象赋给一个更窄类型，不是字段过滤或数据脱敏。</p>
<p>这也是 Object.keys 通常返回 string[]，而不是无条件返回 Array 的重要原因之一：运行时对象可能带有静态类型没列出的键。想按固定字段生成数据，应显式映射或验证，而不是给所有枚举结果加断言后就假定完全准确。</p>
<p>对于真正允许任意额外键的字典，可以设计索引签名或 Record，但这会扩大可接受范围，也可能让拼写错误更难发现。开放字典与固定配置对象应该使用不同的契约。</p>
<h3>可选属性不只是给类型加一个 undefined</h3>
<p>以下例子以 strictNullChecks 与 exactOptionalPropertyTypes 都开启为前提：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Options</span> = { <span class="hljs-attr">label</span>?: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">absent</span>: <span class="hljs-title class_">Options</span> = {};
<span class="hljs-keyword">const</span> <span class="hljs-attr">present</span>: <span class="hljs-title class_">Options</span> = { <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;标题&#x27;</span> };

<span class="hljs-comment">// @ts-expect-error 精确可选属性开启时，不允许显式写入未声明的 undefined</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">explicitUndefined</span>: <span class="hljs-title class_">Options</span> = { <span class="hljs-attr">label</span>: <span class="hljs-literal">undefined</span> };

<span class="hljs-keyword">type</span> <span class="hljs-title class_">RequiredMaybeUndefined</span> = { <span class="hljs-attr">label</span>: <span class="hljs-built_in">string</span> | <span class="hljs-literal">undefined</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">allowed</span>: <span class="hljs-title class_">RequiredMaybeUndefined</span> = { <span class="hljs-attr">label</span>: <span class="hljs-literal">undefined</span> };

<span class="hljs-comment">// @ts-expect-error label 必须存在，即使它的值允许是 undefined</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">missing</span>: <span class="hljs-title class_">RequiredMaybeUndefined</span> = {};
</code></pre></div>
<p>label?:string 表示属性可以不存在，存在时按声明提供 string。label:string|undefined 则要求这个键存在，只是它保存的值允许是 undefined。</p>
<p>关闭 exactOptionalPropertyTypes 时，可选属性对显式 undefined 的赋值限制会更宽松。这个选项并不因为开启 strict 就自动一并启用，所以解释报错时要说明配置，不能把某一份 tsconfig 的行为当成全部项目的默认情况。</p>
<p>无论是否开启精确可选属性，直接读取一个可能不存在的 label 通常仍要处理 undefined。存在性与读到的值类型是两个相关问题，in、Object.hasOwn、对象展开和 JSON 序列化也可能区分“没有这个键”与“键存在但值是 undefined”。</p>
<h3>函数参数和数组索引也有自己的约束</h3>
<p>一个可选参数与对象可选属性并不是完全相同的规则，不能把 exactOptionalPropertyTypes 的结论直接推广到每个带问号的位置。数组索引是否显式包含 undefined，也受 noUncheckedIndexedAccess 和具体类型约束影响。</p>
<p>例如普通 T[] 不保证非空，读取第一项在运行时可以得到 undefined；非空元组可以表达更强的长度关系。类型设计应围绕真实数据，而不是只根据当前编译器是否恰好报警。</p>
<h3>结构相同，业务上也可能不能混用</h3>
<p>用户 ID 和订单 ID 如果都只是 string 别名，就依然能互相传递。需要降低这类混用风险时，可以加入品牌标记，并通过受控工厂建立值：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">userIdBrand</span>: unique <span class="hljs-built_in">symbol</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserId</span> = <span class="hljs-built_in">string</span> &amp; { <span class="hljs-keyword">readonly</span> [userIdBrand]: <span class="hljs-string">&#x27;UserId&#x27;</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">makeUserId</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-title class_">UserId</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^user_[0-9]+$/</span>.<span class="hljs-title function_">test</span>(value)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;用户 ID 格式不正确&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> value <span class="hljs-keyword">as</span> <span class="hljs-title class_">UserId</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">openUser</span>(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-title class_">UserId</span></span>): <span class="hljs-built_in">void</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(id);
}

<span class="hljs-title function_">openUser</span>(<span class="hljs-title function_">makeUserId</span>(<span class="hljs-string">&#x27;user_1&#x27;</span>)); <span class="hljs-comment">// user_1</span>

<span class="hljs-comment">// @ts-expect-error 普通字符串不能直接当成已建立品牌的 UserId</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">wrongId</span>: <span class="hljs-title class_">UserId</span> = <span class="hljs-string">&#x27;order_1&#x27;</span>;
</code></pre></div>
<p>品牌在这里主要存在于类型层，字符串不会因此在运行时多出一个真实 Symbol 属性。工厂中的断言集中在已经执行了相应格式检查的边界上，调用方正常使用接口时就不必到处断言。</p>
<p>这仍不证明该用户真的存在或调用方有访问权限。断言、any 或直接发送请求都可能绕过前端类型层，服务端必须继续处理真正的业务约束。</p>
<h3>结构类型也不是所有类型都只比较公开字段</h3>
<p>类中的 private、protected 成员以及 JavaScript 私有元素会影响兼容性，相关成员的来源或品牌不能简单用另一个同名公开字段伪造。把 TypeScript 叫作结构类型系统，不意味着它完全没有名义化边界。</p>
<p>readonly 也不能简单当成运行时不可变保证；对象方法、可变别名和类型兼容规则还可能产生不同效果。需要运行时冻结或严格受控更新时，应明确加入对应机制。</p>
<p>理解这些差别后，就能把“这个赋值为什么通过”和“这个运行时值是否真的符合业务要求”分开判断。前者依赖结构、上下文与编译选项，后者仍需要明确的构造、验证和权限流程。</p>`};export{e as default};