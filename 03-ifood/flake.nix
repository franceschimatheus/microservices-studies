{
  description = "Root Nix environment for iFood Clone monorepo task execution";

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
            protobuf
            protoc-gen-go
            protoc-gen-go-grpc
          ];

          shellHook = ''
            export PS1="(nix) $PS1"
            echo "=========================================================="
            echo "🚀 Welcome to the iFood Clone monorepo root Nix DevShell!"
            echo "   Go Version:       $(go version)"
            echo "   Protobuf Version: $(protoc --version)"
            echo "   Run 'task compile-proto' to generate gRPC code."
            echo "=========================================================="
          '';
        };
      }
    );
}
