/* ===== module: 97-credits.js ===== */
/* Studyboard Bucks (the green bills): buy Bucks on the website (Stripe), then keep shop items for good with them. A Theme Collection
   (300) brings its theme, its companions, its sticker pack, its pins and its flashcard style; a sticker pack or a flashcard
   style is 100, a pin 50. The server decides every price and the balance (supabase-credits.sql); this file only shows them,
   asks for a purchase, and remembers what the account owns so owns() in 01-style-shop.js can say yes on this device.
   Switched on with studyboard_config.item_purchases (see CREDITS-GUIDE.md).
   The server still calls them credits (studyboard_credit_* tables, studyboard_credits_me, packs like credits_300): Bucks are what
   students see. The earned Studyboard Credits (gold coins, for companion accessories) are a separate currency: 98-0study-credits.js. */
(() => {
  const K = "studyboard:credits";
  const KIND_NAME = {skin: "Theme Collection", sticker: "Sticker Pack", card: "Flashcard Style", pin: "Pin", note: "Note Shape", cm: "Concept Map Style"};
  // Shown until the server has answered once; the server's own prices always win when buying
  const DEFAULT_PRICES = {skin: 300, sticker: 100, card: 100, pin: 50, note: 100};
  // The Studyboard Bucks bill: the exact Studyboard logo raised on a green bill, drawn like the gold Studyboard Credits coin
  // (build-resources/bucks-art/render-bucks.py makes bucks-bill.webp, 160 x 100, and bucks-stack.webp, a small fan of bills).
  // The gold coin belongs to the Studyboard Credits students earn (98-0study-credits.js).
  const COIN_SRC = "data:image/webp;base64,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";
  const COIN = `<img class="sbc-coin" src="${COIN_SRC}" width="32" height="20" alt="" aria-hidden="true">`;
  // A small fan of bills, for the big moments (the price on a buy sheet, Bucks arriving)
  const STACK_SRC = "data:image/webp;base64,UklGRnQhAABXRUJQVlA4WAoAAAAQAAAA/wAAtQAAQUxQSHgGAAABCbaNJCnSgHe7+Qd88D8PfkT/JwBBLxNcvk+VqgAINMnA7Nfx//oD+HWds2MYI2UFaoIDYihu28aR9h875fq9I2ICmOiliUtURgeY2vtZVp+Hy1nueZ/IbGUcSVKbyz8+ipcHKQL9FMQOtipiAgw3knGeooFBA5RoaztmR8/7/VXXznXZVf//V9vWqKcZtW1rqlFWZm33yLZtm7FtJxf/967VxXyFN0lPIsIRG0lS080pdshZYpmB5G+N4iJFYA8Fd0Xs/MHhXtq69NfPvtsDn8eQzfSfS2J944mcY8fGWlDqOS8+sRQkWixKvlVDsWzeTgfbULBmEIHBFrDt7lkiDaQIWhdjFk47+Uy0rzhWF38apdbah19SIKEw848nHceOjxEAsOai2Mpmz5cYFQiz4VjOtdOBYsw8hqK9+Wp5aJsEy4FZdyTtOplobxnMlBGqdiwjFgCzlvGU7dqxsRKcUISZITP+Wap0U8dsJGY7TirQWh4zo/ZNn3ixZzXTWJTDrCeSzjuZSE8FzGpgxbd3amqSXzaFUsyCScfNxUeqwawm0qGZbDVRzEbjOddJBlpKMCuKrbn5POimiFlvJOM62VBZzOqFFkXHjGhqbpi1BlN2PhsfLo9ZXb1A3XUwVPM5nmouegqjcdu1kwF/eczqzxouqAlh1hfJuk4m1F0es/q122QwawumHDcXGyqPWb1/2jl4zQKzsUQubycCPnOY1UtDJHqYGvV4Wgaz/kjOcdOhrqoxq/fJYATUwJi1B9OOm40NVsCswexRFqohMVNFmCXHKmDWkGY4jYfZQDTr5FOhzpKzpSLMGtp5cONg1hFKuU4uOqNCLqzRrZBRXiMkB6zxuJ3PJccsc5g1UsPIEKi+MZsRyzpuKtRRRXJARbgrAVWvlY7OUOGoEh0wjlnDBSIHqstKh+3aiTFVPvWrq/J1lhwYLK50tBvBTEbDga6XSkco47iZaH8VmDU9JVs01RyzQMJxq6x0NEcFgjAvpcoX9pxUsJpKRxOV9qeMy2INoLuosBfpq5D6bcrWcAxL8TRiJx/rDI0ax0yKQGKceVWs4TDTQi+HzC7uOSsxytYKcYOpF2IcfxI0K58kJXvCYBTmhEQbPD9BFnuUMXXmwQRgSvkgjRmuuSc4D0JdreQaSr0o+mJCMepROumF74Mn0pwQGTaDkz6NvBaIJO6KG2p4HdfJdt30EkrvZYlWwJ73GdA1vEiHgV5OYpBYSrYaSb3kAIilQAAmNAISS9qf9vmr6U6rSmqDXJ72XX9ftZ+IpXUZTQkmz/r4UZ9XWbvXLlsNKCrVJjCk9fY5H738c5lTrfmiSXOVJ1oAvzsbXvHwK+Q1s/YBZ3ejaPgDChLbIxw3DgCYs5sYMi9guLWg5SshtECYLuxxYoHYArBktcX4R3Ax3vCAvwC5ZW1/kjAHltyDp+5ZjUU7Se5VbS2ZhfVLJW9IdI2l50ILvkr3EP4EIPjq14VAEnwFEY05bEmuPsbSDZI3hGLathAaktvCv2DI7r8guxl/Qwmv+VOKZdeKlZBdanK+8A0V/t7vD/wHlujSWLSDhA9cv0T4DcKnXgBQoaH4gSR8w7lsCb+rJesheyBtX7Tfn3r5c/8/9TJJTy8rV80/vUz/4L/49LLwg08vFT298AVAL97kLx+BTy+ETy8wrxc9PfwCfHpx+K9P9j+9zBE/9fI3pPef+/2pl6Xyp14WHvC/+sSb/+uTA/ABR/7Uy5L//68+0fj08n//1SeMv5c/vUwNAL1Mvr1D/KtPIP7VJ8CG/f3UiyV+z5vEv/qE8cuEJXzqYcmvLPsGH197jGeJvsHrv0Mr4Xd68aDsA+mWc0CQfUilWfgBsXZi4Qf/BJghulcthc+TfIHRc/vV7dCaQGCGUvIOGpkrZoZFD1Aeuo4+wQ1289aVvw7cJnFXRJFX9t95WegGxJpBft0tfDXO8zSk94Rch9cJU1oHsVquN3UuPviJUA21mgtTfoM8oSZfGUtG3WVNy5RjmfrQVBdk2iaRVjz1Hcz5HYi0SvcZ/Gn6I5VA8lp+W6wM9sIfxJQ8nQ661mCRnW7q+AfShEy33Qlr0mQ+fnRQmmUkQWQ2Gdc2CciRkPUssNIw7W0L4ZtWSoakkoUFmmuRjXx3wyBYE1FT543ZAr7/vCa1FU387GVnZSU4i/7qsRdQm44kW0D7SWccGeu3dGfPurlfffAHSg1WUDgg1hoAADBqAJ0BKgABtgA+SR6NRSKhoxOojnQwBISxtwwMoIE5NcOxlap+wfkt7T0CLw/s+LW5nyTuhf+H6y/9r62P0F/0vcA+0Drr/2n0B/0H/JftB71Pok/yfqAf6j/AdaF6AH60+nL7Gv9u/7H7n/Ad+y//19gD0AOB59G/j/+Z/JntCPh802xL99f5XnR4B/FjUI/Iv55/p/6zwtdpPQF9d/pn/N/wHrMfWebf8d/kPYC/Uz/meTX/jvKA8p9gP+Yf1n/gepz9a+lH84/z//t/z3wHfyL+s/8v/C+2x7Nf3O9lf9pkJrXH0bgUrd8H8Ul/YL5cVthaf0y0CzS/xJmVv3NFrenAxXI7sQx6oz0zdm7Mpj5UiSE0mwXlgZH5R+b32Yi4eZ/dNyh6ftrddyEbLKjdpP7AvGXNV92hed2Ygt8GjquLgL4SbR458Lzo+kmEIn+by71zGTYH81V+mY7Yu/atHztcQ0Ac8W2CEPj6zt7bEzfSFR2JOIx3//xpLUsnXe5OSb6AMy631dmyOo8vz/0VITIeDokXkiv5hN2AXRs4T7e1FMVj+kf4zMix1aiaY+2bjwipQ3MmIBL1qbSdV+wXnh/+EwWHhGbgFMN14nTds4B9GWRqrOrXKTaIdQC2gXVsfm1YsY7gJpVXeKt72hB07//wywned/ZWO/SMDEME4myINsqNoKq//zxecD4NUAJs+gTsLehWstrk/VuP52SwutDDtA9q/5lGQqNuBX1kNpfxQGf//yaipPrBZaNxlvNnyZgKP4bK0zQ3Hja3MhSmaFrxMhrxmBcz+1/87tW+FW2Rl7Kt5W8xaDpLVeCApoFxJbZa3tsWWbXWlCpSLDUoXEciRAxRvisQ1ayCKQfj9c4AWphJWAE6Slg2Yak+FVJ42q+3gcZowx0XSBk4DIidJbpCrsBQTSANa1zA/YJPmYM0cw4WChSdz4+V+nxmZIWl/TLS0ov6zZvrjBK+El8ql0FRCeuN6BUWRJ53gl+ZnzIrExHaLSO4D5OuPMfSl5zMHxRLuQDjb5xVAacduxSPo/8czXdRhdObFZc8rldhbqQZRm3LcIEHDVv7H+klbxOdSujj4pg41nX43FNcVn7MoCe8J5tq4FAakFJHjwp39uj10caINHHDgAD+/keAAABJ/V9XAdLiu5gRiUzNpOLYp6NfovVqhsUNFq8Rl0cu9B0Q+55BP/EUjVBn/6BDIubh3ZL9RbcXQ2Pv2ny1uQzoCG2697976DG3hLPYN5wwJ2kxl2OG3PqKxCY3Rk0vYkZb7e31TtBRBYcNVKUVeLAFdSSWStED8NPJYQ/CDp8s9OFgHWcuj/CMrkhUfjcsc4ITfb6scgKOAmFaAYifSjvnxxv6pwzTgFx3fdOwnegzttGoJzcGuS1tXDVrurA0HOXHMfS/qyrNiT4B0OefpLbON79YyyMVGfdk5kppq2n4BVBrNfJH7VdyW9vt7RlDVkm8VWFOQtxPyK0wuAqo9hkCMO7c/GVuRMDwXABvHpqYF1uhJpKDuycDaYpZCxwfLxDz54wkhmW/3fvJlNDBAez3YLccEBtbYW7x5eeQjONjsfB+zZIpv/724MfIE+QCpvCXOPHqkSmmq76aKTt3EGUwAHfCosGFtik2OttIwiR0Sy6gXEtP8qpJRrVHHpJOxb5+GurSt5M/PD7YFr4W0NsafDyYDq2NezyC84LpGrT+ayCuHDqDA1ZtpJDp9YjXlO7ETN6auF2LYp7WTCxwlaIYMUXfr6CHwMptazr3dNysUu4BbrJxVAsORNloxj8nKmLOALd80o1W5RlNktIWqIt8RSrNGBFpFYQKZ/5zK1yJX730ytceH0de2VZGYlAno9jeExgJelDxpcPHteAeO6yf53P4UTZtahAhO9R1s3Fu88TvpTvOV66x9cfR7YBD9ztmBjSEz+SHQ3uUDH7/e7jL+Xf5bH3gZVMIpKHa6kxu5GTPNikZiakjj6+YR5cUIO46yVYldr+doamsAoxHdNJihGIfafWWf2SUpFgHQs0wU9AZAsazCyoXm1r4do5SpyRleB220ixDh0bFLDLtpsvSLaRWIT76bw3V91xvI2O9GZ/wFRZsHrLXjwDfeJg7KcYR9WGXFP7Evzi3UcZ5CApKWjbZjaTgdJa8BpXLWKbdpUSrxxv7TA+tFcpJ7MLPjzri440BuYzI/OoK/7QxgPyxUvcaD0/FzJ0Dso8mLBV/2a9xse0VV2iCTlwn5GCGaT82xUbAxDpHtdwACglgax3D/59nXMmX6BCMIGRJY2xdpC+by+8QcoQ0JaWICOwrF9bOeBZOFSPZDV32ppaHA7qlprZr6ubALVO//kqFRlh+WYxMNEeRmAYQ/nn0gnZSui1JnQ3ebyquiS6Kp3RohwkAR9w6/BRpgdWK85BHR2txgCCUqMMQq1KYUiZYF0/kO0j130ofm5K3gSaztHCHRcyEjsv7WaMVt3H6M7Wjd88mh8yA91Xpm0wFFfSX1f8klNlv35ruPXEzFv+YeJ9T3XLwCwJKxSe5jYIajQgeEXkIXoAPlG/4CuM2oNVXSeZU68IIRmShE/GNEvn8XScFAn3hjEfOMGSSvtCDmH5wCzQDPxBRwdG8pYD2IZzo0V6IYenkZ8bGxz3zyGLhlnX5UF82CPzCMPibK0GHa9DRN6b/vN4E1OOBpIocmtZxXjpdA49rlaJGPFpxnUuFTKC8AdJsNxslN/BonlDzw6xZgaHVAYkytO1WkTmBiigYA+eOTwnsOz7fr1GYnIvQv4Requt4/0xZ2Fv6O8eto364Gv4SufWHwyYsuj1zHR4YnWivD+KtgjvT100FTeeC+xdt3aV8grOlDDU42Ph5IWUuH16Lw6PUCgNIsUHBD0uJXffxPrMPo03hHw/M3TQMBPgTHSr82zRod36QexfnTH2tE2h5n7+KJKg7LAtF2FhuP+FLuudckVDmxTlwmnyx1MlGabAlj+UGSpyfV2KnZjcqOvF0BOrP2Khhq3TAoleL2/t0xwhH15nD/5vz3TOUtlzsK7MBGK41fxmgz0OeqC3enzcOsVEjVDP794nauRz52TltgcV79fNI57I/VjJ7a9kI2MKL6TrMmTeft/TXnji4kGjafOnbVp7fuIYSLKdf8duyzrwmtBG3DQYdVmBzRGFS0gGKeQfnz3p7M8bVVnjGPz1LVVGhCyXI4wbfj6kPJ0DxqDz3c/G67DI407s7yR4i7LFA6IdanRVvBr3rXZsyIeFUw9vSxHt8BLhI33yAVzwPghz9NQdksqgu5c8D6UXxyfwhoiWrAR+A+TCGSxw4tI4GRF5t/oEWq5cCEZXPMsUPRNWNwdtvrag/U9KuOzDvBT19CAnupiWC+YsRzGlWwotYYkRvt9gsFXWTwdr5uNd2jyQK//sbExgYRQJh1x4u+nBfY6vG50h2y+Z4va4W5aaDWBGL2aHIuFaaNPwJ/ynwgws4v85fHw5EryfsgkYdYb5wPyT3c7DgoSuWxOltUglKIf7Agz3l7eyh6N4uNsVbffyZO7ql1OG4cjGGE0VB4ICNim4M7nj6rCiN7k4aDicDDi3J6E3Oc54vqgui5VzXnDm7C/MDJ2dopZ0LtQ8Nexr22w/Idw4t9zxZz6upyygbFPewHc4jfpfds/7erWycsu9ZMRaqqXCR6afUgDNcK9T6u+cjE6dN1aFsWRV6w7UUrdYAVv2XQv3ozkEBHdBEEGOO8ebcoW/zrnFcdgskNjqWSeaJ5rnsMP//p24iY6PD1JkWbTUozwBmuRIBMjZoupttAp91wH4SLPSBFWsgBC2GJeagq21hCj//uSxQQRoCTIBsTI3ryeziVugCSjf3FJrUVSxSzbhKevcT1dVtvBYz3/2dmbDVfBmqvOEKR2TuoqM+VeTTxsxMgLXCREujJ85Qmoj/izE9s7StX5e2tPeBSn4hNQJID+7MJXLQYcnQqPTgh5bdbt6/eIY+xEXFOlaLnDVlnmovMnzptA5nk2yUXzoX5ZXb4k7PMQEidYXglMs3WXMr8SUcYmALadmBL79QHmfLV4z5tK/UqvbuFYDh8ZNOa+xKV9BYraE3u23ItDUTVDdWQpGMnsZ6NAVtqccry0lvuetsCXEm81jq7MCMNMQ5g/qJA81sufEILYCcjrT9UqW8IwHgH5kKWtC7iZ7YohunfWtaJZdFuzSGAi9u/CAQMbb6kHq6poeQbNP1VBunlgLl4zR3c46f22Y8W1crboRJDBRUslCX//p5/Gr+xIE4Pm/IgQKMS5gv0I9Po9q9i3W5ibDdKIpMcYzqa4AnzMyGAKZ3Tq1LBe1XIp3/gQaBsAcXqh7bUT9kpKaIG6C19YEOuoQ68hmQ7DIojc4ZAQRrqCyQnxWQV5jtqKQITSZ5/i/NmzxpdvE7bjy17G8iHlvpn0pTJ9Dm6V2kBzJbwcYvhz6RhpM3eCRPjf9df2ejj5KFE9zuxPj+4gcr4mmK7nNlKCPlSI/4zRG2L04iCLfPGEsKfW8E0J2CTbv03YWtyqfyKLFDSznQTx89lHRVMQ/uNWg+1p62bxY8SyYQ4e8Kyc7JI/i+r1T8sndeUNO1+7+vjFc3lbmdJrRbtsg+NJWI2pOXPJuJLWdy9XF3jS7M2F/QVI1y0DnAdS3VdCTVkqDmgMRfTYu/X0dtuvhDxrb2+ndekY6F8dPdll4Lhw368rl6Y7NBuQVavjWjM4FSm/mhl1LHQUv8w0JQffHmps8ynMKJtWLPPjYmPyESldkD3o7eYyD9sJuiUby7dxscpGDJM763Vu/eZpEh/TSrpu1iPUfSwAI2MixbRvvf/yBvii/cDX9Lse4PCVCvwTEG12+4VT/Dp0G+xKed6RhRClZyWTWa41xJtHKBcnp0qlxhAgaK22Yf6qFiFLTNIyH6m8Bg+RIgbt1oHG71DcRGIfGwU+2+bJpWlCvj0Zhh68WP3UhmPEf64PszHcWnbcm1gMq3z5e42+ciGGNKPUJm3C+AilpE+o9xmlDGGHJkJZ2yJcuM18B98s/I20gJpQZ27FfRn4LWUZI1kewaxfAMzdw5z6/6s1CqebGnMayeT1SI0yZ+IQGlZM0RsOerE7XkpCYjhM1wdPUEk/5oTuvKPNsm/Z8JBjdY+dPrcWxcMXlv3Ux2NudeCa8+4RBZ8+EYKPEH+CFbc4Es+qYuY5Nm7I9LDaKLodXJVxraacVxqIKBeFwtG7gmxYgqwnkY18m+VSotK5H3d6XAiSMaJRJNlq1cM6yWVurDaUxQ3leanfZefnaNn5gYns+oaXCFMH9jR+q+sQ733+POJDBVXq8SNgKj5Jj6cjiTsACdeUMm7rn7T6RHAcDNhVveMiSU6ro6LuvMC4fXhe5LBY4q2n3Ib36MZGMVJH/D/i6F4wRm6dXROQxfnAVd6GMdyQCGH32ZIeDmdBfdSVBzI8ZwU/QyEIfaZ+gRmCosd5xwgxDtGP/eoY67d31s9bf0wADlpiowJ4RzdTE2f2tFQCgviV+lTJ6wM9eUiUub3d0ZhRp3bYMcKgdC4C/imyoKSjbbE0BXFQj1lmy9BRz5FRXqkRZdfcOEXHoeN9+mtAy9bpUK4KaW6BSgj8yUiUBF3RZBPJY1N0+oNIzVaSy3apUmGm7JNifVYfS1CtiEEM9obNvid3u/X8PWbinFRVtoOcAjW7TKSradpNLt8KxyPrbck51Nzt34WCr3BF/rd+mW1CAY9XJcjWB+tRh2d1m7aJXSL4MThSXW2BAwmkTcwzFea5XSG/bCGgpHzPTemC1qqzazmF8gXaSBbZSbsF/xBG05xlh77kcw7QvVedyrWzOKM9d76WEgTq6lq13XZ3u6mU72CfG+mfioVw1cKaEsvl82XB7DEadeuMXKqBjMwuS8bEBn6+7Z1WLeJuQxjuvI3/svGNC4PX/I2ytvwBW6HfKV3kq+IglZuLRkMYsijrghhc5rMpYtbN8y7XRIJwXD7KWcPs42o6cnTV3Mr4gEYpRjQG1aBDYZdD9XH3x2Ts72IcWZnU6yJ/zdGTKR0a3vXhMhguJ3m/mvJNIjuweIIY9yWH1XpLTe3ahnWeoFbJgYSXNnX4DgQv6egtjK3W8Nrc39rPkK3300nwPGp0tyXxFRfKywEQWpUMY642DleHYfNf8lD6njo/0I4qOLsoyB/qe8BspNmJETSGHtU2kX3c0H2ifdqQxqJs0079jnHQvm7AqN5q2mlEU30OkYW8sBqFeLGU+4jUutkMS2TcQIQ/16DVi69Kk3aTqUfLxCTY+q5O1uz+LhFF//rJZI3d7z46X3lEqYQGl2wpWorkuGGPYeo7e9ApE6Cu6YvJyCL9o2Md3oSxbNHLgVTH+d/hOuGHkqW2A8K3aQvC19kHkxMX+6XG/EjRxI02f4s2P8BlWSVgeaQGee1cvXQ+Zzk0CEw8L4R/DWBcCIaClIOIUTCxqDE6HqlxT/Pp+D1o/tntcSIMv9w5rrIgeDHM+yUPAVzEGauXXh9j9vJlSBonOIBbkBw65tYDd1YkesBIVgfbGQDGkjhs8jr91EKdyukshWEvwZQiRE2k9jggn5TRefROuITWxa2dHPWLXFTxSjXWh92+a8bJ816ylH9BhCB2Rfb5QCJ8hnB8i+RFHlRqU5gDd9ojdH0yR3VJo6WY4eKwWibaLqbPX2eTvBWNibGwO2+QJlmKaZEe9Iv/DjhbweaHx3rhpF3hYlzL8Ss2lSrqgIsQfZPgGWUZeQDP063iaYnlsS8VgkKGNDIuBo5qCcVlsG10Q7MrJiiVoP1ldfjxeQbeb7S1SD8COVPLOeQGwYyn050f999PrqSjGLz3IbENu22R30nlg5cP/Yu+oW/RhWIqXOXKuXJGnOG4Ak9fATWtUK73j8YmL5CXPJxr2IHEP9yMdalSaXa4gjqh6J/5pKPFPDa29TiSu+Gdvhl10FOG0TErLcVkB5JZjlH0XVl3N4gZgxH2p3I/YCB5aBBjoIMGrkFlIG15BEOy8vXx8rX5QqmvqZShhkUXXmVsHQvFknkvIUpLhGpO+e1ZPu4dU4j1Tw+nQ6miy5Q0rqFvatGyWSQ236dcBYzyGAPAoEFe7+e3MyMWgvkVNsRlegwo8mcxTnieyJCH+UDz/OmkK+Y3IWZeXVRORONlqpNI5+NXqMpsV0jgdmKJI9gXloDSCCX0uQub8JK75OwKQMwNp28IkTAc4HTe6EcwyX8WvqnKo/4V8Hpoemh4nL0Dc5pJirPFNZSVgrR9AILvK0004LA/6dqCLW8khYmqtXQN9OE5nbEh2SnNW7hHHsrBLXqN/pmWb0sNe5qkvVlo+nQP+jz0kqBN4aWNaptkorkS1t8YOFmK6vXYsawWscqGpv0uMukyEQU4q6Q5HQIzK9xlM7GRtdG1I+g95n9zcSaYWMoIOZ0ezHNqb/So8xRbrLfy8Inddv5IXM2vJ3fEdd6bkWCg/GRRS1jlIxIJ/XJp1sKRWpo6dlmGgkNPjOfEVgiCytka/yjGegWZwKrKGpv2rUKmIyiNEUlgVSTHiMR+spVqh7sSVsQE/FQ86r0v+7H/rV5Tsblh3fXDpYiO/0wEo/VdBzhbk5hpV5NFwX2pBkBFaDjBAvZZxkBUBqr5ZX8eVnTIVV7ui0X0+H1CWU4blEtwyESUhP5afLQlO10XPQ4mVkm3Hq8ReMCv4sT5fsCE6oLzhRkG5xL28DhGL8rofdqqohCLFMn/TRiHmxrWOQrg+HBAzKT7yX01pPXLmCfl0+XPv3L2ivD3764a6oLEfDWqeys2X41YLc9HnAOMoAs920TKqejnHVM3UpoPnnoGmz9WzxWAl0O5lCoa2g0BCYskHuMAG05rPD7H0i2+xqX2E3/3PUC9mL3hjjXE4gx/oRUG8D8LBfVa7tY1mSSQ2LY7fu2MkAV+++RiHZ5ZID6+hKNcQQD7I8WGZU2fuGV+vV5V7+EFTsNZguB97eft3g1kczzHZyjJrEjIehYislzldIR0ABSkJ+otg3b+6gQZOwLd6MFis7PR3bRYQQ6rdwreddiUEDpZMhiLK4XaPpBv+HJcC8gmKqQcN0okgnxmUdXALHYkX45BcB8LbCyrzehBnbNlsFcSGOD4MT/Gy8tC8cWvW1KGZ7PL95GIAU5buUp6+lkmOZyF+zPPljDbhLL7L/vlhX9fBDZe3n6pxfwYv5HO594ez5blXkM2mYB8rOmXgC9LUQt3lHKqrA9OUYQavOUyGcGX0RcIFaZz7PgnL0NzrxBrSAOYfyDvCuz21JM9zXZsGpLqZlJlEAYj9ruwbTjWkIddOAsl+yLonXlWT9zBu4Us9wWao44v/dEYSEFcqcvCz653koZxbyT7r5BF/CXbv+dabr26xE6W9El0MGgqNWgq6PuyuUx/IadSUjaX2TAQ1ZpQfHpDZVlnTbdkXGUakah2LivSXonREiphkR0M9GhBg1aRX370SfS9Kc5NMY3fj61Dxrr+41ma5e9d9GyxyPeKWw6ujL3sa75ZwdrhAT7/yqy/xOe+6zZHnuuyZ4kux1EpFlUKz75vFglAMl0azQdwjCn2S6ZWSJtxxL1x+s7zQd1Lk+mrBD3BBJBn/1klfoBgEKBkJqTcBBjeb7xSb4g6wKXLOD5nf1nCjEKb8nh5zSnV8D4E3z6Jqsvvg/UV7MdggwRezqcgAbnQHg+fNjAcRR/az9+hAj9Fiu4wq98NSNGCnRLPWi98RqcJRu0tBnMFlfkFxMgcZRdxbIgbGxkrSHk6116SStEgMksptku2Fqns0Jdc7YW4xhdemFAY8G5gr219ssaRYB9B73KAdEa6s6VPJliNXjDCsu9r1VVwnouUGWDS4Q1296j1CyAu9D8eSkx135P7ZucWwi2xMEJqxFkqrClAk7/IAWO013aG5mgll8kh4EpJb85ypz1at3v7U7W5nxwCMDUiGl9pYXJurRXfzAbqdV/L+P96sVKaN9YvfnOfZ694J325wk+Z2eowZgm/8sQanOSh92Gyr/QlWgxAXYyU5y2MwXNVfAy6H5STimRhKZ+nHhB+yuDD3W+wjhxymgSviH8hlyvvn4YqXEWGDI0OETPBFhJhxv+ChgLcfRaJ5OnJJTSFl589SoyRaUJVxH79Wa/AJ5NEyI8QZsUDp33yHcUpkvEWeqR3LAURbfo+nydNQ6mn+hsOcZVZIjwVQP+C0pUzIf3fMAAA==";
  const plural = n => (+n === 1 ? "Buck" : "Bucks");
  const bucks = n => `${(+n || 0).toLocaleString()} ${plural(n)}`;

  // Tests swap in their own server and account (window.__SB_TEST only)
  let fake = null;
  const cl = () => (fake ? fake.sb : typeof sb !== "undefined" ? sb : null);
  const usr = () => (fake ? fake.user : typeof sbUser !== "undefined" ? sbUser : null);
  let C = null;
  try { C = JSON.parse(localStorage.getItem(K) || "null"); } catch (e) { C = null; }
  let owned = new Set();
  const mine = () => { const u = usr(); return C && u && C.uid === u.id ? C : null; };
  function rebuild(){
    const m = mine();
    owned = new Set(m && Array.isArray(m.owned) ? m.owned.filter(x => Array.isArray(x) && x.length === 2).map(x => x[0] + ":" + x[1]) : []);
  }
  rebuild();
  const save = () => { try { localStorage.setItem(K, JSON.stringify(C)); } catch (e) {} };
  const balance = () => { const m = mine(); return m && Number.isFinite(+m.balance) ? +m.balance : 0; };
  const prices = () => Object.assign({}, DEFAULT_PRICES, (mine() && mine().prices) || {});
  const planOk = () => typeof PLAN !== "undefined" && !!PLAN;
  // On when the paywall is on and studyboard_config.item_purchases is true
  const enabled = () => { try { return STORE.paywall && planOk() && !!PLAN.config().item_purchases && !inPreview(); } catch (e) { return false; } };
  const signedIn = () => { const u = usr(); return !!u && !u.is_anonymous; };
  const storeApp = () => { try { return planOk() && PLAN.storeRoute(); } catch (e) { return false; } };

  // A sticker drawn with its own gradient and clip names (the same sticker often sits on the page twice, and a copy that's
  // hidden would otherwise lend its colours to the visible one, washing it out)
  let stkN = 0;
  function stkPic(k){
    const svg = (STICKERS[k] || {}).svg || "", n = ++stkN;
    const own = svg.replace(/\bid=(["'])([^"']+)\1/g, (m, q, i) => `id=${q}${i}-c${n}${q}`).replace(/url\(#([^)]+)\)/g, (m, i) => `url(#${i}-c${n})`).replace(/href=(["'])#([^"']+)\1/g, (m, q, i) => `href=${q}#${i}-c${n}${q}`);
    return `<span class="stk-cell"><svg viewBox="0 0 64 64" aria-hidden="true">${own}</svg></span>`;
  }

  /* ---------- Ownership ---------- */
  const has = (kind, id) => owned.has(kind + ":" + id);
  // The item itself, or (for a companion, sticker pack, pin or flashcard style) the Theme Collection it comes with
  function owns(kind, id){
    if (!owned.size || !id) return false;
    if (has(kind, id)) return true;
    if (kind === "skin") return false;
    const it = (STYLE_LISTS[kind] || []).find(x => x.id === id);
    return !!(it && it.theme && has("skin", it.theme));
  }
  // What an item costs, or 0 when it can't be bought with credits (free items, note shapes, accessories)
  function priceOf(kind, id){
    const p = prices()[kind]; if (!p) return 0;
    const list = kind === "skin" ? SKINS : STYLE_LISTS[kind] || [];
    const it = list.find(x => x.id === id);
    return it && it.tier === "pro" ? +p : 0;
  }
  const themeName = th => ((SKINS.find(x => x.id === th) || {}).name || th);
  function nameOf(kind, id){
    if (kind === "skin") return themeName(id) + " Collection";
    const it = (kind === "sticker" ? STICKER_PACKS : STYLE_LISTS[kind] || []).find(x => x.id === id);
    return it ? String(it.name).replace(/\s*\(Default\)\s*$/i, "") : id;
  }
  // Everything a Theme Collection brings
  function contents(th){
    const r = window.SBTP && SBTP.rec ? SBTP.rec(th) : null, out = [];
    const comps = (STYLE_LISTS.comp || []).filter(c => c.theme === th);
    out.push("The " + themeName(th) + " theme");
    if (comps.length) out.push(comps.length === 1 ? `Its companion, ${comps[0].name}` : `Its ${comps.length} companions: ${comps.map(c => c.name).join(", ")}`);
    if (r && r.pack) { const p = STICKER_PACKS.find(x => x.id === r.pack); if (p) out.push(`${p.name} (${Object.keys(p.items).length} stickers)`); }
    if (r && r.pins && r.pins.length) out.push(r.pins.length === 1 ? "Its pin" : `Its ${r.pins.length} pins`);
    if (r && r.card) out.push("Its flashcard style");
    return out;
  }

  /* ---------- Talking to the server ---------- */
  let loading = null;
  async function load(){
    if (!cl() || !signedIn() || inPreview()) return null;
    if (loading) return loading;
    loading = (async () => {
      try {
        const {data, error} = await cl().rpc("studyboard_credits_me");
        if (error || !data || typeof data !== "object") return null;
        const before = mine(), was = before ? JSON.stringify([before.balance, before.owned]) : "";
        C = Object.assign({}, data, {uid: usr().id, at: Date.now()});
        save(); rebuild();
        if (was !== JSON.stringify([C.balance, C.owned])) {
          if (before && C.balance > before.balance) {
            const got = C.balance - before.balance;
            const bought = !!pending;
            if (pending) { added = {credits: got, balance: C.balance}; pending = null; }
            // bought credits arrive in a burst of light, like a new companion prop (anything else just says so)
            if (bought) { const bal = C.balance; setTimeout(() => burst(got, bal), 120); } // after the Credits sheet is drawn again, so it sits on top
            else if (!(dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])"))) toast(`${bucks(got)} added. You have ${bucks(C.balance)}.`);
          }
          try { applySkin(); } catch (e) {}
          scheduleRender(); redrawOpen();
        }
        return C;
      } catch (e) { return null; } finally { loading = null; }
    })();
    return loading;
  }
  // After a purchase on the website: check again for a few minutes, and whenever the app comes back
  let watchUntil = 0, watchT = 0;
  function watch(){
    watchUntil = Date.now() + 4 * 60000; clearTimeout(watchT);
    const tick = () => { if (Date.now() > watchUntil) return; load(); watchT = setTimeout(tick, 8000); };
    watchT = setTimeout(tick, 5000);
  }
  // The balance is the server's: it's asked again whenever you come back to Studyboard (at most every 20 seconds), so a balance that changed
  // elsewhere (a refund, another tab or device) never shows an old number
  let lastBack = 0;
  const backAgain = () => { if (document.hidden || !enabled() || !signedIn()) return; if (Date.now() < watchUntil || Date.now() - lastBack > 20000) { lastBack = Date.now(); load(); } };
  document.addEventListener("visibilitychange", backAgain);
  window.addEventListener("focus", backAgain);
  // another Studyboard tab saved a newer balance: show it here too
  window.addEventListener("storage", e => {
    if (e.key !== K || !e.newValue) return;
    try { const n = JSON.parse(e.newValue), u = usr(); if (!n || !u || n.uid !== u.id) return; C = n; rebuild(); try { applySkin(); } catch (x) {} scheduleRender(); redrawOpen(); } catch (x) {}
  });

  /* ---------- Sheets ---------- */
  let backToShop = false;
  const shopOpen = () => !!(dlg.open && dlg.querySelector(".sheet.shop, .sheet.ui-shop"));
  function redrawOpen(){
    try {
      const s = dlg.open && dlg.querySelector(".sbc-sheet");
      if (s && s.classList.contains("zoomed")) return; // a redraw would drop the big view the person is looking at
      if (s && s.dataset.kind) buySheet(s.dataset.kind, s.dataset.id);
      else if (s) packsSheet();
      else if (shopOpen()) styleShop();
    } catch (e) {}
  }
  function preview(kind, id){
    if (kind === "skin") { const s = SKINS.find(x => x.id === id); return s ? skinPreview(s, isDark()) : ""; }
    if (kind === "sticker") { const p = STICKER_PACKS.find(x => x.id === id); return p ? `<div class="sbc-stk">${Object.keys(p.items).map(k => stkPic(k)).join("")}</div>` : ""; }
    if (kind === "card") return `<div class="cs-demo cs-${esc(id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div>`;
    if (kind === "pin") return noteDemo(noteShapeOf(null), id, 1);
    if (kind === "note") return noteDemo(id, notePinOf(null), 1);
    if (kind === "cm") return window.SBCMSTYLE ? `<div class="sbc-cm">${SBCMSTYLE.pic(id)}</div>` : "";
    return "";
  }
  const CHEV = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const TICK = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // Every piece of a Theme Collection, drawn as it looks in the app
  function insideHtml(th){
    const r = window.SBTP && SBTP.rec ? SBTP.rec(th) : null, tiles = [];
    let what = "";
    const tile = (label, sub, body, cls) => `<button type="button" class="sbc-in ${cls || ""}" data-act="sbc-zoom" data-what="${what}" data-th="${esc(th)}" aria-label="${esc(label)}: see bigger"><span class="sbc-in-l">${esc(label)}</span><span class="sbc-in-b">${body}</span>${sub ? `<span class="sbc-in-s">${esc(sub)}</span>` : ""}</button>`;
    const comps = (STYLE_LISTS.comp || []).filter(c => c.theme === th);
    if (comps.length) {
      const pic = c => { let u = ""; try { const h = window.SBCOMP && SBCOMP.head ? SBCOMP.head(c.id) : ""; u = h ? "data:image/svg+xml," + encodeURIComponent(h.replace("<svg ", h.includes("xmlns=") ? "<svg " : '<svg xmlns="http://www.w3.org/2000/svg" ')) : window.SBCOMP && SBCOMP.stillUrl ? SBCOMP.stillUrl(c.id) : ""; } catch (e) {} return `<figure title="${esc(c.name)}">${u ? `<img src="${esc(u)}" alt="${esc(c.name)}" width="40" height="40">` : ""}</figure>`; };
      what = "comps"; tiles.push(tile(comps.length === 1 ? "Companion" : `${comps.length} Companions`, comps.map(c => c.name).join(", "), `<div class="sbc-comps">${comps.map(pic).join("")}</div>`));
    }
    const p = r && r.pack && STICKER_PACKS.find(x => x.id === r.pack);
    if (p) { const keys = Object.keys(p.items); what = "stk"; tiles.push(tile(`${keys.length} Stickers`, p.name, `<div class="sbc-stk">${keys.map(k => stkPic(k)).join("")}</div>`)); }
    const cs = r && r.card && CARD_STYLES.find(x => x.id === r.card);
    if (cs) what = "card";
    if (cs) tiles.push(tile("Flashcard", cs.name, `<div class="cs-demo cs-${esc(cs.id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div>`));
    if (r && r.pins && r.pins.length) {
      what = "pins";
      const names = r.pins.map(pid => ((PINS.find(x => x.id === pid) || {}).name || "")).filter(Boolean).join(" · ");
      tiles.push(tile(r.pins.length === 1 ? "Pin" : `${r.pins.length} Pins`, names, `<div class="sbc-pins">${r.pins.map((pid, i) => noteDemo(i ? "rounded" : "classic", pid, i + 2)).join("")}</div>`));
    }
    return tiles.length ? `<div class="sbc-inside"><h3 class="sbc-h">What's Inside</h3><div class="sbc-in-grid">${tiles.join("")}</div></div>` : "";
  }
  // A bigger look at one piece of a collection, over the buy sheet (Back or Escape returns)
  function zoomHtml(what, th){
    const r = window.SBTP && SBTP.rec ? SBTP.rec(th) : null;
    if (what === "comps") {
      const comps = (STYLE_LISTS.comp || []).filter(c => c.theme === th);
      return [comps.length === 1 ? "Companion" : `${comps.length} Companions`, `<div class="sbc-z-comps">${comps.map(c => { let u = ""; try { u = SBCOMP.stillUrl(c.id); } catch (e) {} return `<figure>${u ? `<img src="${esc(u)}" alt="">` : ""}<figcaption>${esc(c.name)}</figcaption></figure>`; }).join("")}</div><p class="sbc-note">They live on your board and cheer you on. Pick one in the Companion tab.</p>`];
    }
    if (what === "stk") {
      const p = r && r.pack && STICKER_PACKS.find(x => x.id === r.pack); if (!p) return null;
      return [`${p.name} · ${Object.keys(p.items).length} Stickers`, `<div class="sbc-z-stk">${Object.keys(p.items).map(k => stkPic(k)).join("")}</div><p class="sbc-note">Drag them onto your sticky notes from the envelope beside the Notes board.</p>`];
    }
    if (what === "card") {
      const cs = r && r.card && CARD_STYLES.find(x => x.id === r.card); if (!cs) return null;
      return [`Flashcard Style · ${cs.name}`, `<div class="sbc-z-card"><div class="cs-demo cs-${esc(cs.id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div></div><p class="sbc-note">How your flashcards look while you study. Use it for every deck, or give one deck its own.</p>`];
    }
    if (what === "pins" && r && r.pins && r.pins.length) {
      return [r.pins.length === 1 ? "Pin" : `${r.pins.length} Pins`, `<div class="sbc-z-pins">${r.pins.map((pid, i) => `<figure>${noteDemo(i ? "rounded" : "classic", pid, i + 2)}<figcaption>${esc((PINS.find(x => x.id === pid) || {}).name || "")}</figcaption></figure>`).join("")}</div><p class="sbc-note">What holds your sticky notes to the board.</p>`];
    }
    return null;
  }
  function zoom(what, th){
    const sheet = dlg.querySelector(".sbc-sheet"); if (!sheet) return;
    const z = zoomHtml(what, th); if (!z) return;
    const body = sheet.querySelector(".sheet-body"); if (!body) return;
    let box = sheet.querySelector(".sbc-zoom");
    if (!box) { box = document.createElement("div"); box.className = "sbc-zoom"; body.appendChild(box); }
    sheet.dataset.scroll = body.scrollTop; body.scrollTop = 0;
    box.setAttribute("role", "dialog"); box.setAttribute("aria-label", z[0]);
    box.innerHTML = `<div class="sbc-zoom-h"><button type="button" class="btn small" data-act="sbc-zoom-x">Back</button><b>${esc(z[0])}</b></div><div class="sbc-zoom-b">${z[1]}</div>`;
    sheet.classList.add("zoomed");
    const back = box.querySelector('[data-act="sbc-zoom-x"]'); if (back) back.focus();
  }
  function unzoom(){
    const sheet = dlg.querySelector(".sbc-sheet.zoomed"); if (!sheet) return false;
    const box = sheet.querySelector(".sbc-zoom");
    if (box) box.remove(); sheet.classList.remove("zoomed");
    const body = sheet.querySelector(".sheet-body"); if (body) body.scrollTop = +sheet.dataset.scroll || 0;
    const t = sheet.querySelector(".sbc-in"); if (t) t.focus();
    return true;
  }
  // Escape closes the big view first, not the whole sheet
  document.addEventListener("keydown", e => { if (e.key === "Escape" && dlg.open && dlg.querySelector(".sbc-sheet.zoomed")) { e.preventDefault(); e.stopPropagation(); unzoom(); } }, true);
  function buySheet(kind, id, note){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    const cost = priceOf(kind, id), bal = balance(), mineOk = signedIn(), enough = bal >= cost;
    const it = kind === "skin" ? null : (kind === "sticker" ? STICKER_PACKS : STYLE_LISTS[kind] || []).find(x => x.id === id);
    const th = it && it.theme && !has("skin", it.theme) ? it.theme : "";
    const inside = kind === "skin" ? insideHtml(id) : "";
    const list = kind === "skin" && !inside ? contents(id) : [];
    const go = !mineOk ? `<button type="button" class="btn primary" data-act="sbc-signin">Sign In to Buy</button>`
      : enough ? `<button type="button" class="btn primary sbc-go" data-act="sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">Buy It for ${COIN}${bucks(cost)}</button>`
      : storeApp() ? "" : `<button type="button" class="btn primary" data-act="sbc-packs">Get Bucks</button>`;
    const wallet = !mineOk ? `<p class="sbc-note">Bucks belong to your account, so sign in first.</p>`
      : `<div class="sbc-wallet" role="status"><span class="sbc-wallet-l">Your balance</span><span class="sbc-wallet-n">${COIN}<b>${bal.toLocaleString()}</b></span>${enough ? `<span class="sbc-chip ok">${bal - cost} left after</span>` : `<span class="sbc-chip">${cost - bal} more needed</span>`}</div>${!enough && storeApp() ? `<p class="sbc-note">Buying Bucks isn't available in this app.</p>` : ""}`;
    openSheet(`<div class="sheet sbc-sheet sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">${head(nameOf(kind, id))}
      <div class="sheet-body">
        ${note ? `<p class="sbc-note sbc-why">${esc(note)}</p>` : ""}
        <div class="sbc-stage sbc-stage-${esc(kind)}" aria-hidden="true">${preview(kind, id)}${kind === "skin" ? `<span class="sbc-stage-l">Theme</span>` : ""}</div>
        <div class="sbc-price"><img class="sbc-price-coin" src="${STACK_SRC}" width="64" height="46" alt=""><span class="sbc-price-t"><b>${bucks(cost)}</b>${KIND_NAME[kind] ? `<span>${esc(KIND_NAME[kind])}</span>` : ""}</span></div>
        ${inside}
        ${list.length ? `<ul class="sbc-list">${list.map(x => `<li>${TICK}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
        ${wallet}
        ${th ? `<button type="button" class="sbc-upsell" data-act="sbc-item" data-kind="skin" data-id="${esc(th)}"><span class="sbc-upsell-t"><b>Get the whole ${esc(themeName(th))} Collection</b><span>The theme, its companions, stickers, pins and this style, for ${bucks(priceOf("skin", th))}</span></span>${CHEV}</button>` : ""}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="sbc-back">${backToShop ? "Back to Shop" : "Not Now"}</button><span class="spacer"></span>${go}${PLAN.isPro() ? "" : `<button type="button" class="btn sbc-getpro" data-act="plan-open" title="Every collection while you're subscribed">Get Pro</button>`}</div></div>`);
  }
  const money = (cents, cur) => { try { return new Intl.NumberFormat(undefined, {style: "currency", currency: String(cur || "usd").toUpperCase()}).format(cents / 100); } catch (e) { return "$" + (cents / 100).toFixed(2); } };
  function packsSheet(){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    if (pending && Date.now() - pending.at > 30 * 60000) pending = null;
    if (added || pending) {
      const body = added
        ? `<div class="sbc-done" role="status"><img class="sbc-done-coin" src="${STACK_SRC}" width="96" height="68" alt=""><b>${bucks(added.credits)} added</b><span>You have ${bucks(added.balance)}. Pick anything in the Style Shop to keep it for good.</span></div>`
        : `<div class="sbc-wait" role="status"><span class="sbc-spin" aria-hidden="true"></span><b>Finish paying in the checkout tab</b><span>${pending.credits ? `Your ${bucks(pending.credits)}` : "Your Bucks"} appear here as soon as Stripe confirms the payment. You can keep using Studyboard meanwhile.</span>
            <div class="sbc-wait-acts"><button type="button" class="btn small" data-act="sbc-reopen">Open Checkout Again</button><button type="button" class="btn small" data-act="sbc-check">Check Now</button></div></div>`;
      openSheet(`<div class="sheet sbc-sheet">${head("Studyboard Bucks")}
        <div class="sheet-body">${body}</div>
        <div class="sheet-foot">${added ? "" : `<button type="button" class="btn" data-act="sbc-cancel">Choose Another Pack</button>`}<span class="spacer"></span><button type="button" class="btn primary" data-act="sbc-back">${backToShop ? "Back to Shop" : "Done"}</button></div></div>`);
      return;
    }
    const m = mine(), packs = m && Array.isArray(m.packs) ? m.packs : null, base = packs && packs[0] ? packs[0].cents / packs[0].credits : 0;
    const body = !signedIn() ? `<p style="margin:0">Bucks belong to your account. Sign in or create a free account first.</p>`
      : storeApp() ? `<p style="margin:0">Buying Bucks isn't available in this app. Bucks you already have work here.</p>`
      : !packs ? `<p class="mini" style="margin:0">Loading…</p>`
      : `<div class="sbc-packs">${packs.map(p => {
          // the extra credits against buying the same money's worth at the smallest pack's rate (a "Bonus" badge from the server
          // is worked out the same way here, so it can't go stale)
          const bonus = base ? Math.round(p.credits - p.cents / base) : 0, bonusTag = bonus >= 1 ? `+${bonus.toLocaleString()} Bonus Bucks` : "", badge = !p.badge || /bonus/i.test(p.badge) ? bonusTag : p.badge;
          return `<button type="button" class="sbc-pack${p.badge === "Best Value" ? " best" : ""}" data-act="sbc-pack" data-id="${esc(p.id)}">${badge ? `<span class="pp-flag">${esc(badge)}</span>` : ""}<span class="sbc-pack-n">${COIN}<b>${esc(Number(p.credits).toLocaleString())}</b> Bucks</span><span class="sbc-pack-p">${esc(money(p.cents, p.currency))}</span>${bonus >= 1 && badge !== bonusTag ? `<span class="mini">${bonus.toLocaleString()} bonus Bucks compared with the ${esc(Number(packs[0].credits).toLocaleString())} pack</span>` : ""}</button>`; }).join("")}</div>
        <p class="mini" style="margin:0">A Theme Collection is ${bucks(prices().skin)} (with its companions, stickers, pins and flashcard style), a sticker pack or flashcard style ${prices().sticker}, a pin ${prices().pin}. Bucks don't expire, and what you keep stays yours even without Pro. You'll pay securely with Stripe on the Studyboard website.</p>`;
    openSheet(`<div class="sheet sbc-sheet">${head("Studyboard Bucks")}
      <div class="sheet-body">
        ${signedIn() ? `<p class="sbc-bal sbc-bal-big" role="status">${COIN}<span>You have <b>${balance().toLocaleString()}</b> ${plural(balance())}</span></p>` : ""}
        ${body}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="sbc-back">${backToShop ? "Back to Shop" : "Close"}</button><span class="spacer"></span>${signedIn() ? "" : `<button type="button" class="btn primary" data-act="sbc-signin">Sign In</button>`}</div></div>`);
    if (!packs && signedIn()) load().then(() => { if (dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])")) packsSheet(); });
  }
  let busy = false;
  async function buy(kind, id, btn){
    if (busy) return; busy = true;
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
    let r = null;
    try { const {data, error} = await cl().rpc("studyboard_buy_item", {p_kind: kind, p_item: id}); r = error ? {error: "network"} : data; } catch (e) { r = {error: "network"}; }
    busy = false;
    if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
    const ERR = {off: "Buying with Bucks isn't available right now.", sign_in: "Sign in first, then try again.", bad_item: "That item can't be bought with Bucks.",
      slow_down: "That's a lot of purchases. Wait a little, then try again.", network: "Couldn't reach Studyboard. Check your connection and try again."};
    if (!r || !r.ok) {
      if (r && r.error === "not_enough") { if (C && typeof r.balance === "number") { C.balance = r.balance; save(); } buySheet(kind, id); return; }
      toast(ERR[r && r.error] || ERR.network); return;
    }
    C = Object.assign({}, mine() || {uid: usr().id, owned: []}, {balance: typeof r.balance === "number" ? r.balance : balance()});
    C.owned = (C.owned || []).concat([[kind, id]]); save(); rebuild();
    try { applySkin(); } catch (e) {}
    const wasShop = backToShop;
    if (dlg.open) dlg.close();
    scheduleRender();
    const left = `${bucks(C.balance)} left.`;
    if (kind === "skin") toast(`The ${themeName(id)} Collection is yours for good. ${left}`, null, {label: "Use It Now", fn: () => { saveStyle({skin: id}); applySkin(); render(); }});
    else toast(`${nameOf(kind, id)} is yours for good. ${left}`);
    if (wasShop) setTimeout(() => { try { styleShop(); } catch (e) {} }, 120);
    load();
  }
  // Build Your Look: a theme (with its Collection) plus up to 5 more pieces, for the price of one Collection
  // (studyboard_buy_bundle in supabase-credits-bundle.sql). items: [[kind, id], ...] of cards, pins and note shapes
  async function buyBundle(th, items, btn){
    if (busy) return false; busy = true;
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
    let r = null, missing = false;
    try { const {data, error} = await cl().rpc("studyboard_buy_bundle", {p_theme: th, p_items: items}); if (error) { missing = /PGRST202|could not find the function/i.test((error.code || "") + " " + (error.message || "")); r = {error: missing ? "off" : "network"}; } else r = data; } catch (e) { r = {error: "network"}; }
    busy = false;
    if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
    const ERR = {off: "Building your own look isn't available yet. You can still get the Collection or each piece.", sign_in: "Sign in first, then try again.", bad_item: "One of those pieces can't be bought with Bucks.",
      own_theme: "You already have this theme. Get the other pieces one by one.", slow_down: "That's a lot of purchases. Wait a little, then try again.", network: "Couldn't reach Studyboard. Check your connection and try again."};
    if (!r || !r.ok) {
      if (r && r.error === "not_enough") { if (C && typeof r.balance === "number") { C.balance = r.balance; save(); } packsSheet(); return false; }
      toast(ERR[r && r.error] || ERR.network); return false;
    }
    C = Object.assign({}, mine() || {uid: usr().id, owned: []}, {balance: typeof r.balance === "number" ? r.balance : balance()});
    C.owned = (C.owned || []).concat([["skin", th]], items); save(); rebuild();
    try { applySkin(); } catch (e) {}
    scheduleRender();
    toast(`Your ${themeName(th)} look is yours for good. ${bucks(C.balance)} left.`);
    load();
    return true;
  }
  // A checkout that's open in another tab: {pack, credits, url, at, from}. The Credits sheet shows it until the credits arrive.
  let pending = null, added = null;
  async function buyPack(id, btn){
    if (!planOk() || !PLAN.checkoutCall) return;
    const all = dlg.querySelectorAll(".sbc-pack"); all.forEach(b => { b.disabled = true; });
    if (btn) btn.classList.add("busy");
    const held = PLAN.holdTab ? PLAN.holdTab() : null;
    const r = await PLAN.checkoutCall({pack: id});
    all.forEach(b => { if (b.isConnected) b.disabled = false; });
    if (btn && btn.isConnected) btn.classList.remove("busy");
    if (r && r.url) {
      const pk = ((mine() || {}).packs || []).find(x => x.id === id) || {};
      pending = {pack: id, credits: +pk.credits || 0, url: r.url, at: Date.now(), from: balance()}; added = null;
      PLAN.openExternal(r.url, held); watch();
      if (dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])")) packsSheet();
      return;
    }
    if (PLAN.dropTab) PLAN.dropTab(held);
    toast((r && r.message) || "Couldn't open checkout. Check your connection and try again.");
  }

  /* ---------- Hooks ---------- */
  // 10-plan.js asks here first when a locked item is tapped (only while item_purchases is on)
  hook("plan-buy-item", (kind, id) => {
    if (!enabled()) return false;
    if (kind === "comp") {
      const c = (STYLE_LISTS.comp || []).find(x => x.id === id);
      if (c && c.theme && priceOf("skin", c.theme)) { buySheet("skin", c.theme, `${c.name} comes with the ${themeName(c.theme)} Theme Collection.`); return true; }
      return false;
    }
    if (!priceOf(kind, id)) return false;
    buySheet(kind, id); return true;
  });
  hook("act", (act, el) => {
    switch (act) {
      case "sbc-packs": packsSheet(); return true;
      case "sbc-item": buySheet(el.dataset.kind, el.dataset.id); return true;
      case "sbc-buy": buy(el.dataset.kind, el.dataset.id, el); return true;
      case "sbc-pack": buyPack(el.dataset.id, el); return true;
      case "sbc-reopen": if (pending) PLAN.openExternal(pending.url); return true;
      case "sbc-check": load(); toast("Checking for your Bucks…"); return true;
      case "sbc-cancel": pending = null; packsSheet(); return true;
      case "sbc-zoom": zoom(el.dataset.what, el.dataset.th); return true;
      case "sbc-zoom-x": unzoom(); return true;
      case "sbc-signin": if (dlg.open) dlg.close(); setTimeout(() => { if (window.SBGUEST) SBGUEST.signUp(); else if (typeof sbSignInSheet === "function") sbSignInSheet(); }, 120); return true;
      case "sbc-back": added = null; if (backToShop) styleShop(); else if (dlg.open) dlg.close(); return true;
    }
    return false;
  });
  hook("menu", () => enabled() && signedIn() ? `<button data-act="sbc-packs" data-group="account"><span>Studyboard Bucks<span class="sub">${bucks(balance())} · Keep themes, stickers and more for good</span></span></button>` : "");
  // Sign-in changes: load this account's credits
  let seenUid = "";
  hook("render", () => {
    const u = signedIn() ? usr().id : "";
    if (u === seenUid) return;
    seenUid = u; rebuild();
    if (u && STORE.paywall) load();
  });

  /* The Style Shop: the balance in its header (always in view while the list scrolls), and each locked item's price on its
     button. Hidden from Pro subscribers, who have every item, unless they've bought credits or still have some. */
  const bought = () => { const m = mine(); return !!(m && m.bought); };
  const showBar = () => enabled() && (!PLAN.isPro() || bought() || balance() > 0);
  const origShop = styleShop; let shopAsked = 0;
  styleShop = function(){
    const r = origShop.apply(this, arguments);
    try {
      const hd = dlg.querySelector(".sheet.shop .sheet-head, .sheet.ui-shop .sheet-head");
      if (hd && showBar() && !hd.querySelector(".sbc-pill")) {
        const n = balance(), txt = signedIn() ? `<b>${n.toLocaleString()}</b><span class="sbc-pill-l">${plural(n)}</span>` : `<span class="sbc-pill-l">Bucks</span>`;
        const close = hd.querySelector('[data-act="close"]');
        const pill = `<button type="button" class="sbc-pill" data-act="sbc-packs" title="Studyboard Bucks: keep any Pro item for good" aria-label="${signedIn() ? `You have ${bucks(n)}. Get more` : "Studyboard Credits"}">${COIN}${txt}</button>`;
        if (close) close.insertAdjacentHTML("beforebegin", pill); else hd.insertAdjacentHTML("beforeend", pill);
        hd.classList.add("has-cr");
      }
      label(dlg);
      // the shop asks for the balance as it opens (it redraws if the number changed)
      if (enabled() && signedIn() && Date.now() - shopAsked > 5000) { shopAsked = Date.now(); load(); }
    } catch (e) { console.warn("credits pill", e); }
    return r;
  };
  function label(root){
    if (!enabled() || PLAN.isPro()) return;
    root.querySelectorAll('[data-act="shop-unlock"]:not([data-cr])').forEach(b => {
      b.dataset.cr = "1";
      const n = priceOf(b.dataset.kind, b.dataset.id); if (!n) return;
      b.innerHTML = `🔒 ${bucks(n)}`;
      b.setAttribute("aria-label", `Buy ${nameOf(b.dataset.kind, b.dataset.id)} for ${bucks(n)}`);
    });
  }
  // Rows the shop fills in later (collections, See All) get their prices too
  try { new MutationObserver(() => { if (dlg.open && dlg.querySelector('[data-act="shop-unlock"]:not([data-cr])')) label(dlg); }).observe(dlg, {childList: true, subtree: true}); } catch (e) {}

  /* Credits you bought: shown in the middle of the screen in a burst of light, the number counting up in the middle (the same look as a new
     companion prop, 98-companion.css .cpu) */
  const SPARK = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"/></svg>';
  const calm = () => { try { return (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !!(window.SBMotion && SBMotion.level() !== "full"); } catch (e) { return false; } };
  function burst(got, bal){
    got = Math.max(0, Math.round(+got || 0)); if (!got) return;
    const old = document.querySelector(".cpu.sbc-burst"); if (old) old.remove();
    const still = calm(), o = document.createElement("div");
    o.className = "cpu sbc-burst" + (still ? " cpu-still" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "sbcBurstName"); o.setAttribute("aria-describedby", "sbcBurstHow");
    if (o.showPopover) o.setAttribute("popover", "manual");
    const sp = (x, y, d, z) => `<span class="cpu-spark" style="left:${x}%;top:${y}%;animation-delay:${d}s;width:${z}px;height:${z}px" aria-hidden="true">${SPARK}</span>`;
    const n = got.toLocaleString();
    o.innerHTML = `<div class="cpu-dim"></div><div class="cpu-box">
      <div class="cpu-stage" aria-hidden="true"><span class="cpu-rays"></span><span class="cpu-rays b"></span><span class="cpu-glow"></span>
        ${sp(8, 18, 0, 20)}${sp(84, 12, .5, 16)}${sp(90, 70, 1.1, 22)}${sp(4, 74, .8, 14)}${sp(48, -4, 1.4, 12)}
        <span class="cpu-prop sbc-bnum"><b data-sbc-count style="font-size:${n.length > 5 ? 2.1 : n.length > 4 ? 2.5 : 3}rem">${still ? n : "0"}</b><small>${plural(got)}</small></span></div>
      <span class="cpu-kick">Bucks Added!</span><h2 class="cpu-name" id="sbcBurstName">+${n} ${plural(got)}</h2>
      <p class="cpu-how" id="sbcBurstHow">Thanks for your purchase. You have ${bucks(bal)} to spend.</p>
      <div class="cpu-acts"><button type="button" class="btn cpu-wear" data-sbc-burst="ok">Got It</button></div></div>`;
    // inside an open window (the Credits sheet): a modal window leaves everything outside it untouchable
    (dlg.open ? dlg : document.body).appendChild(o);
    try { if (o.showPopover) o.showPopover(); } catch (e) {}
    try { if (typeof sbHaptic === "function") sbHaptic("success", {force: true}); } catch (e) {}
    // the number counts up as the disc pops in
    const el = o.querySelector("[data-sbc-count]");
    if (!still) { const t0 = performance.now() + 250, dur = Math.min(1400, 600 + got * 2);
      const step = now => { if (!o.isConnected) return; const f = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - f, 3); el.textContent = Math.round(got * e).toLocaleString(); if (f < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); }
    const back = document.activeElement;
    setTimeout(() => { const b = o.querySelector("[data-sbc-burst]"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 60);
    let closed = false;
    const close = () => {
      if (closed) return; closed = true; o.classList.add("cpu-out");
      setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); }, still ? 0 : 260);
      try { if (back && back.isConnected && back.focus) back.focus({preventScroll: true}); } catch (e) {}
    };
    o.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-sbc-burst]")) close(); });
    o.addEventListener("keydown", e => { if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); if (e.key === "Escape") close(); } });
  }
  if (!document.getElementById("sbc-burst-css")) { const st = document.createElement("style"); st.id = "sbc-burst-css";
    st.textContent = `.sbc-bnum{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:0;color:#14602A;font-family:var(--display)}
.sbc-bnum b{font:900 3rem/1 var(--display);font-variant-numeric:tabular-nums;letter-spacing:-.02em;text-shadow:0 2px 0 rgba(255,255,255,.7)}
.sbc-bnum small{margin-top:2px;font:800 .78rem/1 var(--display);letter-spacing:.14em;text-transform:uppercase;color:#2E8B47}
.sbc-bnum b:not(:only-child){max-width:136px;overflow:hidden}
.sbc-burst .cpu-rays{background:repeating-conic-gradient(from 0deg,rgba(120,220,140,.5) 0deg 7deg,rgba(120,220,140,0) 7deg 22.5deg)}
.sbc-burst .cpu-glow{background:radial-gradient(circle,rgba(210,250,215,.95),rgba(80,190,105,.5) 38%,rgba(40,150,70,0) 70%)}
.sbc-burst .cpu-prop{background:radial-gradient(circle at 35% 30%,#fff,#ECFBEF 60%,#BFEBC8);box-shadow:0 0 0 6px rgba(255,255,255,.55),0 18px 40px rgba(10,80,30,.45),0 0 60px rgba(90,200,115,.75)}
.sbc-burst .cpu-kick{color:#9BF0AE;text-shadow:0 1px 8px rgba(40,170,80,.6)}
.sbc-burst .cpu-acts .cpu-wear{background:linear-gradient(180deg,#6FD682,#1F8A3F)!important;color:#fff!important;box-shadow:0 8px 22px rgba(40,160,70,.45)!important}`;
    document.head.appendChild(st); }
  window.SBCREDITS = {burst, owns, priceOf, balance, load, buySheet, packsSheet, enabled, contents, buyBundle, signedIn: () => signedIn(),
    // "300 Bucks", and the little green bill, for other screens (99-shop-home.js)
    bucks, bill: () => COIN,
    // For tests: what this device remembers
    state: () => (mine() ? JSON.parse(JSON.stringify(mine())) : null)};
  if (window.__SB_TEST) Object.assign(window.SBCREDITS, {fake: (client, user) => { fake = {sb: client, user}; seenUid = ""; rebuild(); scheduleRender(); }, shop: () => styleShop(), unlock: (k, id) => shopUnlock(k, id), pending: () => pending, added: () => added, comps: th => (STYLE_LISTS.comp || []).filter(c => c.theme === th).map(c => c.id)});
})();
