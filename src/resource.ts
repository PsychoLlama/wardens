/**
 * Represents an arbitrary stateful resource that is asynchronously provisioned
 * and destroyed. Resources can own other resources, and destroying a parent
 * first tears down the children.
 */
export default abstract class Resource<
  ExternalApi extends object,
  InitArgs = void,
> {
  /** A hook that gets called when the resource is created. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enter(_params: InitArgs) {
    return;
  }

  /** A hook that gets called when the resource is destroyed. */
  async leave() {
    return;
  }

  /** Returns an external API to the parent resource. */
  abstract exports(): ExternalApi;
}
