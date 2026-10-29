var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器里能跑的主要是小模型任务，比如文本分类、生成向量、图像分类和分割、语音识别，还有很小的文本生成模型。常用的运行库是 ONNX Runtime Web 和 Transformers.js，计算走 WebGPU 用显卡，或者走 WASM 用 CPU。大模型的权重和内存需求一般超出普通设备。</p>
<p>为什么要放在浏览器里跑？因为输入不用发给服务器，能省服务器成本，网络差的时候也能用。</p>
<p>代价是第一次要下载几十 MB 到上 GB 的模型文件，而且 WebGPU 要浏览器、显卡和模型用到的运算都支持才行，所以要做能力检测，不行就回退到 WASM 或云端。</p>
<p>还要注意，本地推理只说明计算在设备上做，模型下载、统计上报照样会联网。离线可用还要求模型已经缓存，并且没被浏览器清理掉。</p>
</blockquote>
<h2>先看一个最小的例子</h2>
<p>下面用 ONNX Runtime Web 加载一个图像分类模型。注意看 <code>executionProviders</code> 这一项，它决定了计算放在哪里做。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> ort <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;onnxruntime-web&#x27;</span>;

<span class="hljs-keyword">const</span> session = <span class="hljs-keyword">await</span> ort.<span class="hljs-property">InferenceSession</span>.<span class="hljs-title function_">create</span>(<span class="hljs-string">&#x27;/models/classifier.onnx&#x27;</span>, {
  <span class="hljs-attr">executionProviders</span>: [<span class="hljs-string">&#x27;webgpu&#x27;</span>, <span class="hljs-string">&#x27;wasm&#x27;</span>], <span class="hljs-comment">// 按顺序尝试，不支持时回退</span>
});

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">classify</span>(<span class="hljs-params">pixels</span>) {
  <span class="hljs-comment">// 输入名、形状和归一化方式都由具体模型决定</span>
  <span class="hljs-keyword">const</span> input = <span class="hljs-keyword">new</span> ort.<span class="hljs-title class_">Tensor</span>(<span class="hljs-string">&#x27;float32&#x27;</span>, pixels, [<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">224</span>, <span class="hljs-number">224</span>]);
  <span class="hljs-keyword">const</span> outputs = <span class="hljs-keyword">await</span> session.<span class="hljs-title function_">run</span>({ <span class="hljs-attr">images</span>: input });
  <span class="hljs-keyword">return</span> outputs.<span class="hljs-property">logits</span>.<span class="hljs-property">data</span>;
}
</code></pre></div>
<p><code>session</code> 就是加载好的模型。创建它要下载文件、做初始化，很慢，所以只创建一次，之后每次推理都复用它，不要每次调用都重新加载。</p>
<p><code>executionProviders</code> 写的是 <code>[&#x27;webgpu&#x27;, &#x27;wasm&#x27;]</code>，意思是先试 WebGPU，不支持再用 WASM。WebGPU 用显卡算，通常更快；WASM 用 CPU 算，慢一些，但几乎所有浏览器都能用。</p>
<p>读者可能会问，<code>[1, 3, 224, 224]</code> 和 <code>images</code> 是哪来的？这些都是模型自己规定的。传给模型的数据叫张量，可以理解成带形状的多维数组。张量的名字、形状、数值类型，还有图片要不要先缩放、归一化，都必须和模型训练时一致，否则不是报错就是结果不对。文本模型还需要配套的 tokenizer，也就是把文字切成模型认识的编号的工具。</p>
<p>Transformers.js 在这一层上面又包了一层，把 tokenizer 和常见任务封装好了，比如 <code>pipeline(&#x27;sentiment-analysis&#x27;)</code> 一行就能做情感分析，适合快速接入现成模型。</p>
<h2>选型时要问哪些问题</h2>
<p>能不能放进浏览器，先过一遍这几个问题：</p>
<table><thead><tr><th>项目</th><th>问题</th></tr></thead><tbody><tr><td>模型体积</td><td>用户能接受多大的首次下载？是否需要量化版本？</td></tr><tr><td>算子</td><td>目标后端是否支持模型用到的全部算子？不支持的会回退 CPU 或直接报错</td></tr><tr><td>内存</td><td>低端手机能否加载？加载失败时有没有云端或降级路径？</td></tr><tr><td>质量</td><td>量化后在真实样本上的准确率是否可接受？</td></tr><tr><td>许可证</td><td>模型权重能否商用和再分发？这和运行时库的开源许可是两回事</td></tr></tbody></table>
<p>表里的“算子”是模型里一个个基本运算，比如矩阵乘法、卷积。WebGPU 后端不一定支持模型用到的每一种，碰到不支持的，要么回退到 CPU，要么直接报错。“量化”是把权重从高精度数字压成低精度，文件小很多，但准确率可能下降，所以要拿真实样本测一下。</p>
<h2>界面上要怎么配合</h2>
<p>模型加载分几个阶段，界面要分开显示：“下载模型 xx%”“初始化”“推理中”。一直显示“思考中”，用户不知道是在下载还是卡死了。</p>
<p>推理很耗计算，放在主线程会让输入和滚动卡住，所以要放进 Worker，细节见<a href="/questions/ai-inference-performance/">《浏览器端 AI 为什么用了 WebGPU 或 Worker 仍可能卡顿？》</a>。模型不用了要释放会话和张量，同时加载的模型数量也要限制，不然内存会撑爆。</p>
<p>权重可以用 Cache Storage 或 OPFS 缓存，下次打开不用重新下载。可是浏览器在存储空间紧张时可能把它们清掉，所以启动时要能处理“缓存没了，重新下载”的情况。</p>
<h2>在本地算，就是数据不出设备吗</h2>
<p>不一定。本地推理只说明输入是在设备上计算的。模型文件要从 CDN 下载，运行库或页面本身也可能有统计上报，这些都会发网络请求。所以对外宣称“离线可用”或“数据不出设备”之前，要实际检查一遍页面发出了哪些请求。</p>
<h2>常见追问</h2>
<p><strong><code>navigator.gpu</code> 存在就能用 WebGPU 推理吗？</strong></p>
<blockquote>
<p>不一定。<code>navigator.gpu</code> 存在只说明浏览器有这个接口，还要能真正拿到显卡适配器和设备，模型用到的运算也要被 WebGPU 后端支持。最稳的办法是启动时用真实模型跑一次探测，失败就回退。</p>
</blockquote>
<p><strong>本地推理的输出可以直接信任吗？</strong></p>
<blockquote>
<p>不可以。模型跑在哪里都可能出错，而且浏览器里的代码用户可以随便改。涉及账号、支付或写操作时，服务端仍然要自己校验。</p>
</blockquote>`};export{e as default};