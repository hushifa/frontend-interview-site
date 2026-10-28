var e={answerHtml:`<h2>简答</h2>
<ul>
<li>用 package.json 的 exports 为每个入口声明 types、import、require 条件，types 条件放在最前。</li>
<li>ESM 和 CommonJS 双格式包需要分别提供对应的声明文件。</li>
<li>声明文件不能引用消费者无法安装的依赖或仓库内的路径别名。</li>
<li>发布前在独立项目中按真实包名安装并检查类型与运行结果。</li>
</ul>
<p>发布 TypeScript 库，至少需要回答两件事：运行时加载哪个 JavaScript 文件，编译器读取哪份类型声明。两份入口必须描述同一套公开 API，并且消费者不应依赖库作者本机的源码路径或工作区别名。</p>
<p>最有效的验证方式，是把实际打包得到的包放进一个独立消费者，再按真实包名导入、检查和运行。</p>
<h2>先做一个边界清楚的 ESM 包</h2>
<p>下面以只承诺 ESM 导入的工具库为例。源码提供一个函数与它的选项类型：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// src/index.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">FormatOptions</span> {
  <span class="hljs-attr">suffix</span>?: <span class="hljs-built_in">string</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">formatCount</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span>, <span class="hljs-attr">options</span>: <span class="hljs-title class_">FormatOptions</span> = {}</span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(value) || value &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;数量必须是非负安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${value}</span><span class="hljs-subst">\${options.suffix ?? <span class="hljs-string">&#x27; 项&#x27;</span>}</span>\`</span>;
}
</code></pre></div>
<p>使用项目选定并安装的 TypeScript 开发依赖构建，tsconfig.json 可以明确输出目录与声明：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;compilerOptions&quot;: {
    &quot;target&quot;: &quot;ES2022&quot;,
    &quot;lib&quot;: [&quot;ES2022&quot;],
    &quot;module&quot;: &quot;NodeNext&quot;,
    &quot;moduleResolution&quot;: &quot;NodeNext&quot;,
    &quot;strict&quot;: true,
    &quot;declaration&quot;: true,
    &quot;noEmitOnError&quot;: true,
    &quot;rootDir&quot;: &quot;src&quot;,
    &quot;outDir&quot;: &quot;dist&quot;
  },
  &quot;include&quot;: [&quot;src&quot;]
}
</code></pre></div>
<p>package.json 将运行入口与类型入口一起暴露：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;@example/count-label&quot;,
  &quot;version&quot;: &quot;1.0.0&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;files&quot;: [&quot;dist&quot;],
  &quot;types&quot;: &quot;./dist/index.d.ts&quot;,
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;types&quot;: &quot;./dist/index.d.ts&quot;,
      &quot;import&quot;: &quot;./dist/index.js&quot;
    }
  },
  &quot;scripts&quot;: {
    &quot;build&quot;: &quot;tsc -p tsconfig.json&quot;
  }
}
</code></pre></div>
<p>构建后应实际存在 dist/index.js 和 dist/index.d.ts。顶层 type:module 让这些 .js 与 .d.ts 采用 ESM 语义。types 提供类型入口， exports 条件则服务遵循现代包解析的消费者，类型条件放在适当的前置位置。</p>
<p>FormatOptions 只存在于类型层，不会成为 JavaScript 中可读取的接口对象。消费者应使用 import type 导入它，真正调用 formatCount 则需要值导入。</p>
<h2>exports 封装了公开路径，不是列出目录就结束</h2>
<p>设置 exports 后，未声明的子路径可能不再允许被消费者按包名深层导入。包中实际有某个内部文件，也不意味着 <code>包名/dist/internal.js</code> 就是受支持的公共入口。</p>
<p>如果要公开额外功能，应增加明确子路径及其类型和运行入口。以后调整内部文件结构时，消费者依赖这些稳定入口，比直接依赖 dist 布局更容易维护。</p>
<p>老版本工具不一定使用同样的 exports 解析规则，因此声明支持范围时应实际测试目标。不要为了让一个工具勉强工作而让 types、exports 和真实模块格式互相矛盾。</p>
<h2>双格式包需要分别匹配声明格式</h2>
<p>如果确实承诺同时支持 import 与 require，可以为它们提供分开的入口。例如发布结构采用 .mjs、.cjs 时，对应声明可采用 .d.mts、.d.cts：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;import&quot;: {
        &quot;types&quot;: &quot;./dist/esm/index.d.mts&quot;,
        &quot;default&quot;: &quot;./dist/esm/index.mjs&quot;
      },
      &quot;require&quot;: {
        &quot;types&quot;: &quot;./dist/cjs/index.d.cts&quot;,
        &quot;default&quot;: &quot;./dist/cjs/index.cjs&quot;
      }
    }
  }
}
</code></pre></div>
<p>这只是入口组织示例，必须由构建流程真正生成四个相互对应的文件，并从两类消费者验证。不能把同一份按 ESM 解释的声明随意指给 CommonJS 分支，然后认为“反正内容都是函数签名”就完全等价。</p>
<p>还有其他合法组织方式，例如在子目录通过 package.json 明确模块格式，关键是让运行时代码与声明的格式一致。现代 Node 能 require 某些同步 ESM，也不等于一个包无需验证就可以对所有 CommonJS 用户承诺兼容。</p>
<p>双构建还可能在同一进程中形成两份模块状态，影响单例、类身份与缓存。如果没有实际兼容需求，单一格式通常更容易保持一致。</p>
<h2>声明不能泄漏开发环境专属路径</h2>
<p>源码里通过 paths 或工作区别名导入的类型，可能原样进入 .d.ts。消费者没有同样的别名配置，就会出现“库自己能编译，安装后找不到类型”的问题。</p>
<p>如果公开声明引用了另一个包的类型，那个包需要通过合适的依赖或 peer 关系对消费者可用，不能只因为作者在 devDependencies 安装过就认为发布后也存在。只供内部测试使用的依赖则不应无意成为公共签名的一部分。</p>
<p>自动推导有时会暴露内部实现类型。发布前应查看生成声明，给公共边界适当的显式签名，避免使用者被迫理解一串未公开的内部路径或复杂类型。</p>
<h2>从实际安装包验证，而不是从源码直接引用</h2>
<p>可以先用 npm pack 在本地生成包，再检查内容清单，确认入口、声明和必要资源都在里面，源码测试、临时文件或本机配置没有误入。</p>
<p>把包安装到独立消费者后，至少检查以下路径：运行时按包名导入函数；TypeScript 能推导返回值并拒绝错误参数；import type 能找到公开类型；承诺的子路径可用；未公开内部路径没有被当成隐含 API。</p>
<p>若支持 CommonJS、不同 moduleResolution 或一定范围的 TypeScript 版本，应分别准备消费者。仓库内 monorepo 链接可能直接指向源码，掩盖产物缺失，不能替代安装包测试。</p>
<p>files 字段可以限制发布内容，但仍要看 pack 的实际清单。declarationMap 若要帮助跳回源码，还需要确保映射目标可用；只发布地图却遗漏其指向内容，不能保证消费者体验。</p>
<h2>类型兼容也是版本契约的一部分</h2>
<p>运行函数名字没变，类型参数、重载顺序、返回联合或可选属性的变化，也可能让使用者升级后无法编译。类型修正可能是合理的，但仍应按公开兼容承诺评估与说明。</p>
<p>构建成功只能证明作者环境完成了构建，声明生成成功只能证明产生了文件。最终可信的发布证据，是消费者从包入口拿到正确类型，并能运行到对应的真实实现。</p>`};export{e as default};