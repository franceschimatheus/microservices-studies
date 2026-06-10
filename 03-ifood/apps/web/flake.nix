{
  description = "Nix devShell for iFood Clone Web App";

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
            nodejs
            pnpm
          ];

          shellHook = ''
            echo "🚀 Next.js Web App DevShell Loaded"
            echo "   Node Version: $(node -v)"
          '';
        };
      }
    );
}
