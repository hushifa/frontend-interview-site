var e={notesHtml:`<p>默认输出每行一条 JSON 日志，Fastify 内置使用它。日志格式化和发送由 transport 在独立的 worker 线程中处理，减少对主线程的影响。</p>
<p>开发时用 pino-pretty 美化输出，生产环境保留 JSON 便于日志系统采集。日志级别和 redact 选项可以在创建实例时配置，避免记录敏感字段。</p>
<p>许可：MIT。</p>`};export{e as default};