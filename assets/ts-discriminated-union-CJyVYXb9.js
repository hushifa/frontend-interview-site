var e={answerHtml:`<p>多个独立布尔值容易组合出“正在加载但又成功又失败”的无效状态。可辨识联合用一个字面量字段区分分支，使每个分支只包含自身需要的数据。</p>
<p>TypeScript 的类型检查发生在编译期，运行时仍然执行生成的 JavaScript；类型声明不会自动校验接口返回值、用户输入或第三方数据。回答类型题时应明确哪些保证来自编译器，哪些需要运行时校验或测试补上。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">State</span>&lt;T&gt; =
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&quot;loading&quot;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&quot;success&quot;</span>; <span class="hljs-attr">data</span>: T }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&quot;error&quot;</span>; <span class="hljs-attr">error</span>: <span class="hljs-title class_">Error</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">read</span>(<span class="hljs-params"><span class="hljs-attr">state</span>: <span class="hljs-title class_">State</span>&lt;<span class="hljs-built_in">string</span>&gt;</span>) {
  <span class="hljs-keyword">if</span> (state.<span class="hljs-property">status</span> === <span class="hljs-string">&quot;success&quot;</span>) {
    <span class="hljs-keyword">return</span> state.<span class="hljs-property">data</span>;
  }
}
</code></pre></div>
<p>在 <code>switch</code> 中处理所有分支，并让默认分支的变量赋给 <code>never</code>，可在新增状态却漏写处理时得到类型错误。</p>
<p>公共类型还要考虑调用方的错误提示、类型推导速度、模块发布方式和版本兼容。复杂类型可以用类型测试验证，但不要为了表达一个简单约束引入难以维护的递归类型。</p>
<p>实际项目里，类型最容易在接口边界失效：后端返回、localStorage、URL 参数和第三方库都不是编译器可以直接信任的输入。把类型声明、运行时校验和错误处理放在同一条数据流上，类型才真正能降低维护成本。</p>`};export{e as default};