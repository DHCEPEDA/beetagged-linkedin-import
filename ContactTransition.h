//
//  ContactTransition.h
//  
//
//  Created by Chris O'Neil on 1/3/14.
//
//

#import <Foundation/Foundation.h>
#import "Constants.h"

@interface ContactTransition : NSObject <UIViewControllerAnimatedTransitioning>

@property (nonatomic, assign) NSTimeInterval presentationDuration;
@property (nonatomic, assign) NSTimeInterval dismissalDuration;
@property (nonatomic, assign) BOOL isPresenting;

@end
