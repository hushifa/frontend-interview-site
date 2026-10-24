var e={answerHtml:`<p><code>interface</code> 和 <code>type</code> 都能描述对象结构。<code>interface</code> 支持声明合并，可通过 <code>extends</code> 扩展；类型别名可以描述联合类型、元组、原始类型别名以及映射类型等。</p>
<p>TypeScript 的类型检查发生在编译期，运行时仍然执行生成的 JavaScript；类型声明不会自动校验接口返回值、用户输入或第三方数据。回答类型题时应明确哪些保证来自编译器，哪些需要运行时校验或测试补上。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> }
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Admin</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">User</span> { <span class="hljs-attr">role</span>: <span class="hljs-string">&quot;admin&quot;</span> }
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Result</span> = { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: <span class="hljs-title class_">User</span> }
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">error</span>: <span class="hljs-built_in">string</span> };
</code></pre></div>
<p>组合对象时，<code>extends</code> 与交叉类型遇到冲突属性的报错行为不同。公开且需要可扩展的对象契约可优先考虑接口；表达联合关系时使用类型别名更直接。团队一致性也很重要。</p>
<p>公共类型还要考虑调用方的错误提示、类型推导速度、模块发布方式和版本兼容。复杂类型可以用类型测试验证，但不要为了表达一个简单约束引入难以维护的递归类型。</p>
<p>在实际项目中，类型最容易在接口边界失效：后端返回、localStorage、URL 参数和第三方库都不是编译器可以直接信任的输入。把类型声明、运行时校验和错误处理放在同一条数据流上，类型才真正能降低维护成本。</p>`};export{e as default};