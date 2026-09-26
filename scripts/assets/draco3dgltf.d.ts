declare module 'draco3dgltf' {
  const draco: {
    createDecoderModule(options?: Record<string, unknown>): Promise<unknown>;
    createEncoderModule(options?: Record<string, unknown>): Promise<unknown>;
  };
  export default draco;
}
