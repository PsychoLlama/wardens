{
  description = "Wardens, a framework for resource management";

  outputs = { self, nixpkgs }:
    with nixpkgs.lib; {
      devShell = genAttrs systems.flakeExposed (system:
        let pkgs = import nixpkgs { inherit system; };
        in pkgs.mkShell { nativeBuildInputs = with pkgs; [ yarn nodejs ]; });
    };
}
