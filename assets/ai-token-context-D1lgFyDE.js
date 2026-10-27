var e={answerHtml:`<h2>字符、字节和 Token 不是一回事</h2>
<p>JavaScript 的 <code>string.length</code> 统计的是 UTF-16 代码单元，UTF-8 字节数统计的是编码后的存储大小，Token 则是目标模型分词器处理文本的单位。英文单词、中文、空格、标点、代码和特殊格式都可能以不同方式切分。</p>
<p>因此“一个中文字符等于一个 Token”只能算经验说法，不能用于限制请求或计算账单。换模型、版本或消息格式，同一段文字也可能得到不同计数。</p>
<h2>真正发送的内容通常比输入框长</h2>
<p>一次请求可能包含系统提示、历史消息、工具定义、检索片段、附件描述和协议包装。用户只输入一句话，服务端却可能把几十轮对话和多个工具 Schema 一起发送。图片、音频和工具处理还可能有各自的计量规则。</p>
<p>计数必须针对即将发送给目标模型的完整结构，而不是只计算当前 textarea。优先使用服务商提供的计数接口或与目标模型匹配的 tokenizer；前端字符数只能用于提前提醒。</p>
<h2>上下文窗口要给输出留空间</h2>
<p>上下文限制通常包含输入和输出，但具体字段和计费规则由模型决定。不能把窗口全部填入历史，再期待模型仍能生成完整答案。工具调用的后续结果也会继续占用下一轮预算。</p>
<p>一个简单的预算策略是先保留系统约束和输出空间，再决定历史和检索内容：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">buildContext</span>(<span class="hljs-params">{ system, history, docs, limit, outputBudget, count }</span>) {
  <span class="hljs-keyword">const</span> fixed = <span class="hljs-title function_">count</span>(system) + outputBudget;
  <span class="hljs-keyword">if</span> (fixed &gt;= limit) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;固定内容已经超过模型上限&#x27;</span>);

  <span class="hljs-keyword">const</span> available = limit - fixed;
  <span class="hljs-keyword">const</span> recent = <span class="hljs-title function_">takeRecentMessages</span>(history, available * <span class="hljs-number">0.45</span>, count);
  <span class="hljs-keyword">const</span> retrieved = <span class="hljs-title function_">selectRelevantDocs</span>(docs, available - <span class="hljs-title function_">count</span>(recent), count);
  <span class="hljs-keyword">return</span> { system, <span class="hljs-attr">history</span>: recent, retrieved };
}
</code></pre></div>
<p>这是预算逻辑，不是通用 Token 计算器。发送前仍要按完整请求重新计数，并在服务端执行硬限制，不能让用户绕过浏览器估算提交超大请求。</p>
<h2>截断历史不能破坏任务结构</h2>
<p>从字符串开头按字符删除，可能切断系统约束、工具调用和对应结果，也可能留下一个没有上下文的错误消息。应按消息、任务阶段和重要性选择内容，并保证工具调用与工具结果成对保留。</p>
<p>历史摘要可以减少体积，但它是有损转换。摘要要保留用户约束、关键决定、未完成事项、来源和重要 ID；涉及权限、金额和代码版本时，最好保留可追溯的原始记录。摘要不能把“执行失败”改写成“已完成”。</p>
<p>检索内容过多时，应先提高召回与重排质量，去重并限制单文档大小，而不是盲目扩大上下文。内容更长不等于答案更准确。</p>
<h2>Token 预算和隐私是同一个问题</h2>
<p>检索片段、工具结果和附件即使最后被截断，也已经进入过处理链路。应在检索和工具执行前做租户权限过滤、敏感字段脱敏和长度限制，不能把全部数据交给模型后再寄希望于截断能防泄露。</p>
<p>前端提示可以显示估算值和接近上限的提醒，但不要在日志中保存完整提示词、令牌和附件内容。服务端记录目标模型、输入输出 usage、缓存读写和版本，才能在结算时使用正确的价格。</p>
<h2>费用必须按实际用量分类</h2>
<p>输入、输出、缓存读取、缓存写入和多模态数据可能采用不同价格。不能用“请求次数 × 平均 Token”推算精确账单，也不能因为缓存命中就认为输入免费。最终响应中的 usage 才是记录费用的主要依据，模型和价格变化时还要保存当时的版本。</p>
<p>接近上限时，产品应明确告诉用户将减少哪些历史、检索或输出，而不是静默删除刚输入的内容或统一显示网络错误。用户知道失败原因，才有可能有效调整后重试。</p>`};export{e as default};