var e={answerHtml:`<h2>简答</h2>
<ul>
<li>构建成功只证明构建阶段完成，不证明线上拿到的是同一份完整产物。</li>
<li>文件完整性、来源证明、发布一致性是三个问题，一个 SHA-256 解决不了全部。</li>
<li>一次构建生成一个发布标识和含路径、大小、摘要的清单，各环境部署同一份产物。</li>
<li>计算摘要要流式读取，读取失败必须让校验失败。</li>
</ul>
<p>构建成功后把 dist 上传到服务器，首页却引用一个不存在的 JS 文件。可能是只上传了一半、旧 HTML 尚未失效，或者部署脚本把两次构建混到同一个目录。编译通过只能证明构建阶段完成，不能证明线上得到的是同一份完整产物。</p>
<h2>三个问题分别验证</h2>
<p>文件完整性回答“传输后的字节是否与构建输出相同”；来源证明回答“它由哪个源码和构建流程产生”；发布一致性回答“用户拿到的 HTML 和资源能否配套工作”。一个 SHA-256 值不能同时解决这三件事。</p>
<p>建议一次构建生成一个发布标识，记录源码提交、锁文件和工具链信息，并为输出文件生成包含相对路径、大小与摘要的清单。之后各环境部署同一份产物，而不是每个环境再分别构建一次却沿用同一个发布标识。</p>
<h2>怎样计算一个文件的摘要</h2>
<p>下面用 Node.js 流式读取文件，不需要把整个资源一次性装入内存：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createReadStream } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:fs&#x27;</span>;
<span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sha256File</span>(<span class="hljs-params">file</span>) {
  <span class="hljs-keyword">const</span> hash = <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>);
  <span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> <span class="hljs-title function_">createReadStream</span>(file)) hash.<span class="hljs-title function_">update</span>(chunk);
  <span class="hljs-keyword">return</span> hash.<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;hex&#x27;</span>);
}
</code></pre></div>
<p>读取失败应让校验失败，不能返回空字符串假装成功。生成完整清单时还要排序路径、明确排除清单自身，并在文件不再变化后读取；否则同一次枚举可能混入新旧内容。</p>
<p>验证时除了比较所有清单项，还要检查缺失文件和不允许出现的额外文件。相对路径必须拒绝绝对路径、路径穿越及不受支持的符号链接，不能让一份外部清单诱导工具读取发布目录之外的数据。构建专用文件、私密配置和 SSR 中间产物是否应进入公开目录，应在生成清单前明确。</p>
<h2>摘要一致不等于来源可信</h2>
<p>如果攻击者能同时替换 JS 文件和旁边的摘要清单，两者仍可完全一致。预期摘要必须来自可信构建记录、受保护的制品仓库或经过验证的签名，而不能从同一个可被篡改的来源临时读取后自证安全。</p>
<p>文件名中的短 hash 通常服务于缓存失效，不应默认当成安全完整性证明。SRI 可以让浏览器校验特定脚本或样式的内容，但不会自动校验所有动态资源、HTML 或整个部署目录；它也不能证明源码与依赖没有恶意逻辑。</p>
<h2>发布目录要作为一个整体切换</h2>
<p>在支持版本目录的托管环境中，可以先把新产物上传到独立版本目录，核对清单与关键页面，再切换入口。这样不会让正在更新的目录半边是旧版本、半边是新版本。对象存储、CDN、静态平台各有发布机制，不应假设普通逐文件复制本身是原子的。</p>
<p>若平台只能覆盖固定目录，应明确上传顺序、入口缓存失效和失败恢复机制。先发布资源再发布引用它们的 HTML 可以减少一种缺文件窗口，但不能让整个发布成为事务。已经打开的旧页面稍后还可能请求旧的懒加载资源，是否保留历史资源属于部署取舍，需要结合平台与用户要求决定。</p>
<h2>线上核验要考虑传输表示</h2>
<p>本地构建文件与 CDN gzip/br 压缩后的字节可能不同。校验源文件摘要时，应确认比较的是解码后的原始表示还是存储对象的编码表示，不能把压缩结果与未压缩清单直接比较。CDN 自动改写 HTML、图片转码等功能也会改变内容，需要在发布策略中明确。</p>
<p>除了摘要，应检查首页和深层路由的状态码、资源 Content-Type、缓存头及引用可达性。返回 200 的资源请求也可能实际拿到 SPA 回退 HTML；文件存在与浏览器能执行是两件事。至少用生产页面验证关键导航和动态导入路径。</p>
<h2>回滚必须回到完整版本</h2>
<p>仅恢复 index.html，而对应资源已经删除或服务端 API 不兼容，并不是完整回滚。回滚单元应包含 HTML、资源清单、配置和需要协调的接口兼容窗口。若发布失败，保留可定位的发布标识与失败阶段，避免下一次部署继续在未知混合状态上覆盖。</p>
<p>对于普通静态网站，构建后内容验证、文件清单与一次完整发布通常已能覆盖很多常见失误；高风险系统再加入受保护构建、签名和来源验证。不要为了堆叠工具忽略最基本的“同一次构建、完整上传、可回退”。</p>`};export{e as default};