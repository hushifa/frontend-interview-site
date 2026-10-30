var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如写一个 React 组件库：运行时要调用 <code>clsx</code>，所以它放 <code>dependencies</code>，别人安装你的组件库时会一起装上；测试用的 <code>vitest</code>、打包用的工具只在开发组件库时需要，放 <code>devDependencies</code>，使用者安装时不会装它们；React 本身应该由使用者的项目提供，组件库只声明“我需要和 React 18 或 19 一起用”，这就是 <code>peerDependencies</code>。</p>
<p>四种依赖的区别在于“谁装、什么时候装”。<code>devDependencies</code> 只有在包的根目录执行 <code>npm install</code> 时才会装，加上 <code>--omit=dev</code>，或者 <code>NODE_ENV</code> 设为 <code>production</code>，也会跳过。<code>peerDependencies</code> 在 npm 3 到 6 里不会自动安装，只给警告；从 npm 7 开始默认会安装，和别的包要求的版本冲突时会报错。<code>optionalDependencies</code> 是装不上也没关系的依赖，安装或构建失败不会让整个安装失败，但代码要自己处理它不存在的情况。</p>
<p><code>npm install</code> 不带参数时，先比较 <code>package.json</code> 和 <code>package-lock.json</code>：lockfile 里的版本满足 <code>package.json</code> 的范围，就按 lockfile 装；不满足就重新解析并更新 lockfile。然后按扁平化算法安排目录，依赖尽量放在顶层的 <code>node_modules</code>，版本冲突的才嵌套到使用它的包下面。最后执行 <code>preinstall</code>、<code>install</code>、<code>postinstall</code> 这些生命周期脚本。</p>
<p>要注意，<code>--omit</code> 只是不把包装到磁盘上，这些依赖仍然会被解析并写进 lockfile。另外 npm 文档建议 <code>peerDependencies</code> 的范围写宽一些，比如 <code>^1.0</code>，写死补丁版本容易和别的插件冲突。</p>
</blockquote>
<h2>四种依赖装在哪里</h2>
<p>先看一个组件库的 <code>package.json</code>：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;my-ui&quot;,
  &quot;dependencies&quot;: {
    &quot;clsx&quot;: &quot;^2.1.0&quot;
  },
  &quot;devDependencies&quot;: {
    &quot;vitest&quot;: &quot;^3.0.0&quot;
  },
  &quot;peerDependencies&quot;: {
    &quot;react&quot;: &quot;^18.0.0 || ^19.0.0&quot;
  },
  &quot;optionalDependencies&quot;: {
    &quot;fsevents&quot;: &quot;^2.3.0&quot;
  }
}
</code></pre></div>
<p>使用者在自己的项目里执行 <code>npm install my-ui</code>，会装上 <code>clsx</code> 和 <code>react</code>（npm 7 起自动安装 peer），<code>fsevents</code> 装得上就装，装不上也不报错；<code>vitest</code> 不会装。只有维护 <code>my-ui</code> 的人在它的根目录执行 <code>npm install</code>，才会装上 <code>vitest</code>。</p>
<p>npm 文档对 <code>dependencies</code> 有一句明确提醒：不要把测试框架、编译工具这类开发时用的东西放进 <code>dependencies</code>。放进去的话，所有使用者都要多下载一堆用不到的包。</p>
<p>为什么 React 不能直接放 <code>dependencies</code>？如果组件库自己依赖一份 React，使用者的项目又有一份，两份版本不兼容时，npm 会把组件库那份嵌套安装在它自己下面，页面里就同时存在两份 React。<code>peerDependencies</code> 的意思是“我不自己带，用宿主项目那份”，npm 会检查宿主提供的版本是否在范围内。</p>
<h2>peerDependencies 的冲突和可选 peer</h2>
<p>npm 7 开始自动安装 peer，带来一个变化：如果两个插件要求的宿主版本没有交集，依赖树就解不出来，安装会报错。这时可以用 <code>--legacy-peer-deps</code>，npm 会像 3 到 6 版那样完全忽略 <code>peerDependencies</code>。npm 文档不推荐这样做，因为它不再保证 peer 的版本约定，有些包可能依赖这个约定才能正常工作。</p>
<p>有些宿主是可选的，比如一个工具同时支持 Sass 和 Less，不需要使用者两个都装。可以在 <code>peerDependenciesMeta</code> 里把它标成 <code>optional: true</code>，npm 就不会自动安装这个 peer：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;peerDependencies&quot;: {
    &quot;sass&quot;: &quot;^1.0.0&quot;,
    &quot;less&quot;: &quot;^4.0.0&quot;
  },
  &quot;peerDependenciesMeta&quot;: {
    &quot;less&quot;: { &quot;optional&quot;: true }
  }
}
</code></pre></div>
<h2>optionalDependencies 要自己兜底</h2>
<p>npm 文档的例子是用 <code>try...catch</code> 去加载可选依赖，加载失败就把它设为 <code>null</code>，后面用之前先判断。原因是 npm 只保证“装不上不报错”，不会替你处理“没装上时代码怎么办”。另外，同名的包如果同时写在 <code>dependencies</code> 和 <code>optionalDependencies</code> 里，后者会覆盖前者，所以最好只写在一处。加上 <code>--omit=optional</code> 可以完全不装可选依赖。</p>
<h2>npm install 的流程</h2>
<p>不带参数执行 <code>npm install</code>，大致是下面几步：</p>
<ol>
<li>比较 <code>package.json</code> 和 <code>package-lock.json</code>。lockfile 里解析出的版本满足 <code>package.json</code> 的范围，就用 lockfile 的确切版本；不满足，比如把 <code>^7.0.0</code> 改成了 <code>^8.0.0</code>，就重新解析并更新 lockfile。</li>
<li>构建依赖树。npm 文档给的例子是，A 依赖 B 和 C，B 也依赖 C，那么 C 只装一份在顶层，B 直接用它。如果 B 要 D@1、C 要 D@2，D@1 放顶层，D@2 就嵌套到 C 下面。</li>
<li>下载并解压到 <code>node_modules</code>，<code>--omit</code> 里列出的类型不写到磁盘。</li>
<li>执行生命周期脚本。<code>preinstall</code> 在依赖下载解压之前运行，<code>install</code> 和 <code>postinstall</code> 在依赖装好之后运行。</li>
</ol>
<p>扁平化带来的幽灵依赖问题见<a href="/questions/eng-package-managers/">《npm、yarn 和 pnpm 有什么区别？幽灵依赖是什么？》</a>，lockfile 和 <code>npm ci</code> 的区别见<a href="/questions/engineering-lockfile/">《为什么需要提交 lockfile？npm ci 和 npm install 有何区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样把包安装到不同的依赖类型里？</strong></p>
<blockquote>
<p><code>npm install 包名</code> 默认写进 <code>dependencies</code>；加 <code>-D</code>（<code>--save-dev</code>）写进 <code>devDependencies</code>；加 <code>-O</code>（<code>--save-optional</code>）写进 <code>optionalDependencies</code>；加 <code>--save-peer</code> 写进 <code>peerDependencies</code>。</p>
</blockquote>
<p><strong>线上部署时怎样不装开发依赖？</strong></p>
<blockquote>
<p>执行 <code>npm install --omit=dev</code>。<code>NODE_ENV</code> 为 <code>production</code> 时，<code>omit</code> 的默认值就是 <code>dev</code>。npm 文档还说明，最终的 omit 列表包含 <code>dev</code> 时，npm 会把生命周期脚本里的 <code>NODE_ENV</code> 设为 <code>production</code>。要注意，前端项目通常在构建时需要 devDependencies 里的打包工具，所以构建阶段不能省略它们。</p>
</blockquote>
<p><strong><code>bundleDependencies</code> 是做什么的？</strong></p>
<blockquote>
<p>它是一个包名数组，执行 <code>npm pack</code> 时，这些依赖会被一起打进 tarball。适合要离线分发、或者希望用一个文件就能装好的场景。版本仍然由 <code>dependencies</code> 决定。</p>
</blockquote>`};export{e as default};