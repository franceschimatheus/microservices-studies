{
  description = "A Nix development environment for Scalable Systems and Microservice Studies in Go";

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
            go-task
            gopls
            gotools
            golangci-lint
          ];

          shellHook = ''
            echo "=========================================================="
            echo "🚀 Welcome to the Microservices Studies Nix DevShell!"
            echo "   Go Version: $(go version)"
            echo "   Run 'task' to list all available execution tasks."
            echo "=========================================================="
          '';
        };
      }
    );
}
