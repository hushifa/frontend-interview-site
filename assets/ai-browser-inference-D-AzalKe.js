var e={answerHtml:`<h2>简答</h2>
<ul>
<li>适合浏览器的是小模型任务：文本分类、向量生成、图像分类与分割、语音识别、小型文本生成。大模型的权重和内存需求通常超出普通设备。</li>
<li>运行时负责执行模型，输入要严格匹配模型的张量名、形状、类型和预处理方式；文本还需要配套的 tokenizer。</li>
<li>WebGPU 吞吐通常更高，但要求浏览器、显卡和模型算子都支持；WASM 走 CPU，兼容面更广。两者都要做能力检测并准备回退。</li>
<li>首次使用要下载几十 MB 到上 GB 的权重，界面要分别显示下载、初始化和推理阶段。</li>
<li>输入不离开设备是优势，但模型下载、遥测等请求仍会联网；离线使用还要求权重已缓存且没有被浏览器清理。</li>
</ul>
<h2>最小示例</h2>
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
<p>会话创建一次后复用，不要每次推理都重新加载模型。Transformers.js 在此基础上封装了 tokenizer 和常见任务（<code>pipeline(&#x27;sentiment-analysis&#x27;)</code> 等），适合快速接入现成模型。</p>
<h2>选型时检查什么</h2>
<table><thead><tr><th>项目</th><th>问题</th></tr></thead><tbody><tr><td>模型体积</td><td>用户能接受多大的首次下载？是否需要量化版本？</td></tr><tr><td>算子</td><td>目标后端是否支持模型用到的全部算子？不支持的会回退 CPU 或直接报错</td></tr><tr><td>内存</td><td>低端手机能否加载？加载失败时有没有云端或降级路径？</td></tr><tr><td>质量</td><td>量化后在真实样本上的准确率是否可接受？</td></tr><tr><td>许可证</td><td>模型权重能否商用和再分发？这和运行时库的开源许可是两回事</td></tr></tbody></table>
<h2>界面与资源管理</h2>
<ul>
<li>分别显示&quot;下载模型 xx%&quot;&quot;初始化&quot;&quot;推理中&quot;，不要一直显示&quot;思考中&quot;。</li>
<li>推理放进 Worker，避免阻塞输入和滚动，细节见&quot;浏览器端 AI 为什么用了 WebGPU 或 Worker 仍可能卡顿？&quot;。</li>
<li>不再使用时释放会话和张量；限制同时加载的模型数量。</li>
<li>用 Cache Storage 或 OPFS 缓存权重，但浏览器在存储压力下可能清理它们，下次启动要能重新下载。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong><code>navigator.gpu</code> 存在就能用 WebGPU 推理吗？</strong> 不一定。还要能拿到适配器和设备，模型算子也要被 WebGPU 后端支持，最好用真实模型做一次启动探测。</li>
<li><strong>本地推理的输出可以直接信任吗？</strong> 不可以。输出照样可能出错，涉及账号、支付或写操作时仍要服务端校验。</li>
</ul>`};export{e as default};