var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浏览器需要使用的值一定会以某种形式交给浏览器，客户端变量不能保存密钥。</li>
<li>Vite 默认把 <code>VITE_</code> 前缀的变量暴露给客户端代码，这是暴露规则，不是加密。</li>
<li><code>.env</code> 被 git 忽略只说明没提交到仓库，不代表值没有进入构建产物。</li>
<li>签名密钥等敏感信息只放在受控的服务端，由服务端代为调用。</li>
</ul>
<p>只要浏览器需要使用一个值，这个值就必须以某种形式交给浏览器。它可能出现在 JavaScript、HTML、配置响应或网络请求中，不会因为最初写在 .env 文件里就变成用户无法取得的秘密。</p>
<p>因此要区分“构建机器上的环境变量”和“客户端可读取的配置”。服务端签名密钥可以留在受控服务端环境中；公开接口地址、显示开关等才是常见的前端配置。</p>
<h2>VITE_ 是暴露规则，不是加密方式</h2>
<p>Vite 默认把符合 VITE_ 前缀的环境变量暴露给客户端源码。例如：</p>
<div class="not-prose code-block"><div class="code-language">dotenv</div><pre><code class="hljs language-dotenv">VITE_API_BASE_URL=https://api.example.com
VITE_FEATURE_ENABLED=false
</code></pre></div>
<p>代码中可以读取：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> apiBaseUrl = <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">env</span>.<span class="hljs-property">VITE_API_BASE_URL</span>;
<span class="hljs-keyword">const</span> featureEnabled = <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">env</span>.<span class="hljs-property">VITE_FEATURE_ENABLED</span> === <span class="hljs-string">&#x27;true&#x27;</span>;
</code></pre></div>
<p>构建时，相应引用可以被替换并进入产物。即使变量名经过压缩，或者值没有直接显示在界面，客户端实际使用它时仍然无法把它当成秘密。</p>
<p>未使用的代码可能被优化掉，但不能依赖优化恰好删除某个值来保密。envPrefix、自定义 define、插件或手工输出配置也可能改变暴露范围；没有 VITE_ 前缀不代表经过任何自定义处理后都绝不泄漏。</p>
<h2>.env 被忽略与值是否公开是两个问题</h2>
<p>.gitignore 可以避免把某个文件提交进仓库，却不能阻止构建工具把其中允许暴露的值编进前端资源。源码仓库私有，也不意味着公开部署的 dist 内容只有自己可读。</p>
<p>同样，不应把 .env 或其他秘密配置放进会原样发布的静态目录。是否提交源码、是否参与构建、是否进入最终响应，是三条需要分别检查的路径。</p>
<p>公开项目 ID、公钥或厂商明确设计为客户端使用的发布标识，可能本来就允许公开；私密凭据则不同。判断依据是它代表的权限和服务端限制，不只是名字里有没有 key。</p>
<h2>自定义环境变量通常是字符串</h2>
<p>示例中的 false 读取后通常是字符串 &quot;false&quot;。如果写成 <code>Boolean(import.meta.env.VITE_FEATURE_ENABLED)</code>，非空字符串仍会得到 true，功能就可能与配置相反。</p>
<p>数字也需要明确转换与范围校验，缺失、空字符串和无效数字不能一律当成正常默认值。较复杂配置可以在统一入口验证，然后向业务代码提供明确类型。</p>
<p>Vite 的部分内建字段有自己的类型，例如 DEV、PROD、SSR 是布尔值，MODE 和 BASE_URL 等是字符串。不能把“自定义 env 通常是字符串”推广成对象里的每一个字段都相同。</p>
<h2>文件与外部环境有优先级</h2>
<p>Vite 可以读取通用文件与按模式区分的文件。通常相应覆盖关系是：已有进程环境优先，其次是模式专属的本地文件、模式文件，再到通用本地文件和通用文件。</p>
<p>因此 .env.staging 中写了一个值，CI 外部注入同名变量时，实际使用的可能仍是 CI 的值。排查时要确认变量从哪里进入，而不是只打开一个 .env 文件。</p>
<p>开发服务器通常在启动时加载环境文件，修改后需要按工具要求重启。构建产物已经发布后，再修改部署机器上的 .env，也不会自动改写已经生成的静态 JavaScript。</p>
<h2>mode 与 NODE_ENV 不应混为一谈</h2>
<p>mode 用于选择环境文件与相应模式配置。Vite 开发默认使用 development 模式，构建默认使用 production 模式，也可以显式指定 staging 等模式。</p>
<p>在未另外改变 NODE_ENV 的常见情况下，<code>vite build --mode staging</code> 仍是生产构建，只是 MODE 为 staging，并读取对应模式文件。不能把 staging 自动理解成“未压缩的开发环境”。</p>
<p>DEV、PROD 等行为还与相应 NODE_ENV 设置有关。正式排查应核对完整命令、工具配置和产物，不只根据文件名猜构建性质。</p>
<h2>一个产物部署到多套环境怎么办</h2>
<p>构建时配置意味着不同环境可能需要不同产物。若希望同一份前端包部署到多个环境，可以在启动时读取公开配置文件、服务端注入的公开配置或其他明确入口。</p>
<p>这能改变配置更新的时机，却不会让运行时配置变成秘密。浏览器能获取的配置响应一样可见，还要处理加载失败、缓存和版本兼容。</p>
<p>功能开关也不能代替权限。把管理员入口在界面里隐藏，不会阻止用户直接调用接口；服务端必须按身份与资源规则授权。</p>
<h2>私密能力应放在真正受控的边界</h2>
<p>需要私密 API 凭据的操作，通常由受控服务端执行，并根据用户权限开放有限能力。不是把密钥换成混淆字符串、加密后再把解密代码一起发给浏览器，就实现了保密。</p>
<p>上线前可以检查实际构建产物与网络响应，使用测试值确认哪些配置会进入客户端。目的不是证明某次搜索不到变量名，而是让每个客户端配置都确实适合公开，并让秘密只在需要它的受控环境中使用。</p>`};export{e as default};