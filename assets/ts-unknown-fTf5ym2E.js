var e={answerHtml:`<h2>简答</h2>
<ul>
<li>any 关闭类型检查，会沿着赋值扩散。</li>
<li>unknown 可以接收任意值，但使用前必须先收窄，适合外部输入。</li>
<li>never 表示不可能存在的值，用于穷尽检查和不会正常返回的函数。</li>
<li>void 表示返回值不会被使用，与 never 不同。</li>
</ul>
<p>这三个类型分别对应三种不同态度：any 是暂时放宽很多检查；unknown 是承认输入还没弄清楚，使用前必须验证；never 是在当前模型里不应该有任何值能够到达这里。</p>
<p>它们不是三种 JavaScript 运行时值。类型标注不会把数据变成 any、unknown 或 never，也不会自动改变它实际包含的属性。</p>
<h2>any 的方便来自放弃部分检查</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">unsafeName</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">any</span></span>) {
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">profile</span>.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>();
}
</code></pre></div>
<p>即使调用方传入一个没有 profile 的对象，这段函数本身也可以通过常见类型检查。编译器无法替你保证链上的属性和方法存在，运行时仍可能抛 TypeError。</p>
<p>any 还容易向外传播：读取 any 的属性、调用返回 any 的函数，后续变量也可能继续处于宽松状态。因此一个接口边界上的 any，可能让一大片业务代码失去原本应有的错误提示。</p>
<p>在迁移遗留代码、补充不完整第三方声明等场景，局部使用 any 可以作为有意识的过渡，但应限制范围、说明契约，并尽量尽早转换成具体类型或 unknown，而不是把每个报错都用 any 消掉。</p>
<h2>unknown 让调用方先证明输入结构</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readName</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">if</span> (
    <span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span> || value === <span class="hljs-literal">null</span> ||
    !(<span class="hljs-string">&#x27;name&#x27;</span> <span class="hljs-keyword">in</span> value) || <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;string&#x27;</span>
  ) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;输入必须包含字符串 name&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">name</span>.<span class="hljs-title function_">trim</span>();
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readName</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27; 小林 &#x27;</span> })); <span class="hljs-comment">// 小林</span>
</code></pre></div>
<p>unknown 可以接收任意类型的值，包括 null、undefined。它不允许在没弄清类型时直接把值当函数调用或读取任意属性，因此这里先排除非对象和 null，再检查 name 是否存在且为字符串。</p>
<p>通过这些真实的运行时判断后，TypeScript 才能在后面的路径中把 value.name 视为 string，允许调用 trim。检查只证明了本例声称的结构，并不自动证明名字非空、长度合理或用户身份有效；额外业务规则需要继续明确添加。</p>
<p>接口响应、JSON.parse 结果和第三方数据适合在应用边界上视为 unknown。需要注意，JSON.parse 自身的标准类型声明可能返回 any，不是调用它就自然获得 unknown；可以主动把结果赋给 unknown，再进行校验。</p>
<h2>类型断言不是 unknown 的验证步骤</h2>
<p><code>value as User</code> 只改变编译器的视角，不做任何运行时检查；外部输入为何必须解析见《为什么 TypeScript 不能替代接口数据校验？》。非空断言 <code>value!</code> 也不会把 null 变成正常对象。</p>
<p>如果代码先把 unknown 强制断言成具体类型，再直接访问属性，就绕过了 unknown 原本要求的证明过程。确定来自受控内部结构时，断言可以表达编译器暂时无法推断的事实；面对外部输入时，应由真实检查或 schema 解析建立可信边界。</p>
<p>unknown 也不是“只能做一次 typeof”的限制。可以通过 Array.isArray、instanceof、属性判断、相等比较或可信的类型守卫逐步收窄，选择依据是输入的实际契约。</p>
<h2>never 用来表达不可能的分支</h2>
<p>never 表示不可能存在的值。switch 处理完联合的所有分支后，default 中的变量会被收窄为 never，传给 <code>assertNever(value: never)</code> 即可在新增分支时得到编译错误。完整示例和运行时边界见《如何用可辨识联合避免不合理的状态组合？》。</p>
<h2>never 与 void 不是一个意思</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fail</span>(<span class="hljs-params"><span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(message);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">printMessage</span>(<span class="hljs-params"><span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">void</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(message);
}
</code></pre></div>
<p>void 表达调用方不依赖有意义的返回值，函数可以正常执行结束。never 表达没有正常返回的可能，例如总是抛错的同步函数，或不会结束的执行过程。</p>
<p>一个 async 函数即使只会拒绝，也仍然先返回 Promise，类型可能是 Promise，而不是直接返回 never。一个返回 Promise 的函数“不成功兑现”，与“调用本身永远不正常返回”不能混淆。</p>
<p>never 也可能出现在互相矛盾的类型交叉、排除所有联合成员等类型计算里。此时应先检查建模是否有冲突，不要立刻用断言把 never 消掉。</p>
<h2>选择依据是你愿意建立什么保证</h2>
<p>无法信任的输入优先 unknown，再检查成明确结构；不可能分支用 never 帮助维护完整性；确实需要跳过一段暂时无法准确描述的代码时，才局部采用 any。</p>
<p>这些类型发挥作用还依赖编译选项和代码边界。例如严格空值检查能更准确地区分 null、undefined，未检查的数据仍会削弱后续保证。与其追求“没有红线”，更应该让类型错误指出数据契约尚未明确的位置。</p>`};export{e as default};