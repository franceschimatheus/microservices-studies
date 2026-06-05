{
  description = "Nix devShell for iFood Clone Gateway Service";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            go
            gopls
            golangci-lint
          ];

          shellHook = ''
            echo "🚀 Gateway Service DevShell Loaded"
            echo "   Go Version: $(go version)"
          '';
        };
      }
    );
}
